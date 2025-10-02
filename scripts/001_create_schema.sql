-- Create users table with role-based access
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin', 'manager')),
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;

-- Users can view their own data
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own data
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- Admins can view all users
create policy "admins_select_all"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create managers table (managed by admins)
create table if not exists public.managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now(),
  created_by uuid references public.users(id)
);

alter table public.managers enable row level security;

-- Managers can view their own profile
create policy "managers_select_own"
  on public.managers for select
  using (user_id = auth.uid());

-- Admins can view all managers
create policy "admins_select_managers"
  on public.managers for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert managers
create policy "admins_insert_managers"
  on public.managers for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update managers
create policy "admins_update_managers"
  on public.managers for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete managers
create policy "admins_delete_managers"
  on public.managers for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create client_accounts table (managed by managers)
create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  contact_person text,
  email text,
  phone text,
  manager_id uuid not null references public.managers(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now()
);

alter table public.client_accounts enable row level security;

-- Managers can view their own client accounts
create policy "managers_select_own_clients"
  on public.client_accounts for select
  using (
    exists (
      select 1 from public.managers
      where id = manager_id and user_id = auth.uid()
    )
  );

-- Managers can insert their own client accounts
create policy "managers_insert_clients"
  on public.client_accounts for insert
  with check (
    exists (
      select 1 from public.managers
      where id = manager_id and user_id = auth.uid()
    )
  );

-- Managers can update their own client accounts
create policy "managers_update_clients"
  on public.client_accounts for update
  using (
    exists (
      select 1 from public.managers
      where id = manager_id and user_id = auth.uid()
    )
  );

-- Managers can delete their own client accounts
create policy "managers_delete_clients"
  on public.client_accounts for delete
  using (
    exists (
      select 1 from public.managers
      where id = manager_id and user_id = auth.uid()
    )
  );

-- Admins can view all client accounts
create policy "admins_select_all_clients"
  on public.client_accounts for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null check (task_type in ('agreement', 'review', 'new_account')),
  client_account_id uuid not null references public.client_accounts(id) on delete cascade,
  manager_id uuid not null references public.managers(id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'in_progress', 'agreement_done', 'waiting_for_review', 'review_done', 'closed')),
  description text,
  created_at timestamp with time zone default now(),
  created_by uuid references public.users(id),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  closed_at timestamp with time zone
);

alter table public.tasks enable row level security;

-- Managers can view their own tasks
create policy "managers_select_own_tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.managers
      where id = manager_id and user_id = auth.uid()
    )
  );

-- Managers can update their own tasks
create policy "managers_update_own_tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.managers
      where id = manager_id and user_id = auth.uid()
    )
  );

-- Admins can view all tasks
create policy "admins_select_all_tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert tasks
create policy "admins_insert_tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update tasks
create policy "admins_update_tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete tasks
create policy "admins_delete_tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'manager')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create indexes for better performance
create index if not exists idx_managers_user_id on public.managers(user_id);
create index if not exists idx_client_accounts_manager_id on public.client_accounts(manager_id);
create index if not exists idx_tasks_manager_id on public.tasks(manager_id);
create index if not exists idx_tasks_client_account_id on public.tasks(client_account_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_created_at on public.tasks(created_at);

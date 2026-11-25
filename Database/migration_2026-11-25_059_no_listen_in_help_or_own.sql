-- migration 059: no extra listening replies in a person's own Amit chat, and none on the owner's Claude for connected people
create or replace function public.cha_listen_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'listen' and (
       exists (select 1 from public.cha_conversations c where c.id = new.conversation_id and c.purpose = 'help')
    or coalesce((select raw_user_meta_data ->> 'own_claude' from auth.users where id = new.asker), '') = 'true')
  then return null; end if;
  return new;
end $$;
drop trigger if exists cha_asks_a_listen_guard on public.cha_asks;
create trigger cha_asks_a_listen_guard before insert on public.cha_asks for each row execute function public.cha_listen_guard();

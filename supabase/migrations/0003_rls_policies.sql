-- Grant access to own session
drop policy if exists sessions_all_for_session on sessions;
create policy sessions_all_for_session on sessions for all
  using (id::text = current_setting('request.headers', true)::json->>'x-session-id')
  with check (id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Grant access to own taste profile
drop policy if exists taste_profiles_all_for_session on taste_profiles;
create policy taste_profiles_all_for_session on taste_profiles for all
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
  with check (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Grant access to own feedback
drop policy if exists feedback_all_for_session on feedback;
create policy feedback_all_for_session on feedback for all
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
  with check (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Grant access to own chat messages
drop policy if exists chat_messages_all_for_session on chat_messages;
create policy chat_messages_all_for_session on chat_messages for all
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
  with check (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Allow anonymous users to call the search function
grant usage on function match_tracks to anon;
grant execute on function match_tracks to anon;

-- Allow authenticated (via session) users to use the API
grant usage on function match_tracks to authenticated;
grant execute on function match_tracks to authenticated;

-- Allow anon users to read their own session data
create policy sessions_anon_read on sessions for select to anon
  using (id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Allow anon users to read their own taste profile
create policy taste_profiles_anon_read on taste_profiles for select to anon
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Allow anon users to read their own feedback
create policy feedback_anon_read on feedback for select to anon
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- Allow anon users to read their own chat messages
create policy chat_messages_anon_read on chat_messages for select to anon
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

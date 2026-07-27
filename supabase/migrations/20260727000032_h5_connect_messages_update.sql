-- H5 — Connect messages UPDATE: sender-only (audit 2026-07-16)

DROP POLICY IF EXISTS connect_messages_update ON public.connect_messages;
CREATE POLICY connect_messages_update ON public.connect_messages
  FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid()
    AND public.connect_is_member(conversation_id)
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND public.connect_is_member(conversation_id)
  );

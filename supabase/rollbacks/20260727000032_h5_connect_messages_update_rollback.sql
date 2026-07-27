-- Rollback H5 — restore pre-H5 connect_messages_update policy

DROP POLICY IF EXISTS connect_messages_update ON public.connect_messages;
CREATE POLICY connect_messages_update ON public.connect_messages
  FOR UPDATE TO authenticated
  USING (
    public.connect_is_member(conversation_id)
    AND (sender_id = auth.uid() OR public.connect_is_member(conversation_id))
  )
  WITH CHECK (public.connect_is_member(conversation_id));

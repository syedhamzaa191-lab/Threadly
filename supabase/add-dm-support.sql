-- Add DM support to channels table
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS is_dm boolean NOT NULL DEFAULT false;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS dm_user_ids uuid[] DEFAULT NULL;

-- Index for fast DM lookups
CREATE INDEX IF NOT EXISTS idx_channels_dm ON public.channels (workspace_id, is_dm) WHERE is_dm = true;

-- Function to find or create a DM channel between two users
CREATE OR REPLACE FUNCTION public.find_or_create_dm(
  ws_id uuid,
  user1 uuid,
  user2 uuid
) RETURNS uuid AS $$
DECLARE
  dm_id uuid;
BEGIN
  SELECT id INTO dm_id FROM public.channels
  WHERE workspace_id = ws_id
    AND is_dm = true
    AND dm_user_ids @> ARRAY[user1, user2]
    AND dm_user_ids <@ ARRAY[user1, user2];

  IF dm_id IS NOT NULL THEN
    RETURN dm_id;
  END IF;

  INSERT INTO public.channels (workspace_id, name, is_dm, dm_user_ids, created_by)
  VALUES (ws_id, 'dm', true, ARRAY[user1, user2], user1)
  RETURNING id INTO dm_id;

  RETURN dm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

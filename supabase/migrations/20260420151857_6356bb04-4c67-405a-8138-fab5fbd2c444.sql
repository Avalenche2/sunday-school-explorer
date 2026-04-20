DO $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
BEGIN
  -- Vérifie si l'utilisateur existe déjà
  SELECT id INTO v_existing_id FROM auth.users WHERE email = 'isaacfanou1512@gmail.com';

  IF v_existing_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Insertion dans auth.users (simule supabase.auth.admin.createUser)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'isaacfanou1512@gmail.com',
      crypt('Kingzack15#', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Isaac","last_name":"Fanou"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Insertion identité email (nécessaire pour login email/password)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'isaacfanou1512@gmail.com', 'email_verified', true),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    v_user_id := v_existing_id;
  END IF;

  -- S'assure que le profil existe (au cas où le trigger ne se serait pas déclenché)
  INSERT INTO public.profiles (id, first_name, last_name, age)
  VALUES (v_user_id, 'Isaac', 'Fanou', NULL)
  ON CONFLICT (id) DO UPDATE
    SET first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;

  -- S'assure que le rôle enfant existe
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'enfant')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Attribue le rôle admin (super admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Trace dans admin_requests (historique propre)
  IF NOT EXISTS (SELECT 1 FROM public.admin_requests WHERE user_id = v_user_id) THEN
    INSERT INTO public.admin_requests (
      user_id, first_name, last_name, email, status, reviewed_at, reviewed_by
    ) VALUES (
      v_user_id, 'Isaac', 'Fanou', 'isaacfanou1512@gmail.com', 'approved', now(), v_user_id
    );
  END IF;
END $$;
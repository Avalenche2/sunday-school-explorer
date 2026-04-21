DO $$
DECLARE
  _uid uuid;
  _email text := 'isaacfanou1512@gmail.com';
  _password text := 'Kingzack15#';
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = _email;

  IF _uid IS NULL THEN
    _uid := gen_random_uuid();

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
      _uid,
      'authenticated',
      'authenticated',
      _email,
      crypt(_password, gen_salt('bf')),
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
      _uid,
      jsonb_build_object('sub', _uid::text, 'email', _email, 'email_verified', true),
      'email',
      _uid::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- S'assurer que le profil existe (au cas où le trigger n'ait pas tourné)
  INSERT INTO public.profiles (id, first_name, last_name, age)
  VALUES (_uid, 'Isaac', 'Fanou', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Ajout du rôle admin (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Trace dans admin_requests
  INSERT INTO public.admin_requests (user_id, email, first_name, last_name, status, reviewed_at)
  VALUES (_uid, _email, 'Isaac', 'Fanou', 'approved', now())
  ON CONFLICT DO NOTHING;
END $$;
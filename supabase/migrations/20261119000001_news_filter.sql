create or replace function news_private.unkind(body text) returns boolean language sql immutable set search_path='' as $$
 select regexp_replace(translate(lower(body), '013457@$!', 'oieastasi'), '[^a-z]', '', 'g') ~ '(fuck|shit|bitch|cunt|nigger|nigga|faggot|retard|killyourself|motherfucker|asshole|bastard|whore|slut|chink|kike|tranny)';
$$;

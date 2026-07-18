-- L'e-mail de connexion vit dans auth.users ; on le duplique dans
-- profiles pour l'afficher (équipe & comptes) et pour lier un parent
-- par e-mail lors de l'import CSV d'élèves.
alter table profiles add column email text;

-- ==========================================
-- LUART - PUBLIC CONTACT FORM SCHEMA
-- ==========================================
-- Como el formulario de contacto es público (sin login), necesitamos una tabla
-- que permita insertar filas asegurando que atacantes no puedan leerlas o borrarlas.

CREATE TABLE public.public_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (Muy importante)
ALTER TABLE public.public_contacts ENABLE ROW LEVEL SECURITY;

-- Política 1: PERMITIR INSERCIÓN ANÓNIMA
-- Cualquiera puede enviar un mensaje (crear una fila)
CREATE POLICY "Allow public insert to contacts" 
  ON public.public_contacts FOR INSERT TO anon 
  WITH CHECK (true);

-- No creamos política de SELECT, UPDATE o DELETE.
-- De esta forma, los mensajes insertados son "invisibles" para el público.
-- Solo los administradores desde el panel de Supabase podrán ver los mensajes o borrarlos.

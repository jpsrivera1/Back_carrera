require('dotenv').config();
const app = require('./app');
const supabase = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Verificar Supabase al arrancar (no fatal — red puede estar lenta al inicio)
  try {
    const { error } = await supabase.from('participantes').select('id').limit(1);
    if (error) {
      console.warn('Advertencia Supabase al arrancar:', error.message);
    } else {
      console.log('Conexión a Supabase establecida correctamente');
    }
  } catch (err) {
    console.warn('Advertencia: no se pudo verificar Supabase al arrancar:', err.message);
    console.warn('El servidor inicia igual. Las peticiones fallarán si Supabase no está disponible.');
  }

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();

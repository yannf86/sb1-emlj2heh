import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// Récupération des variables d'environnement
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Fonction pour envoyer un email de bienvenue avec un lien de réinitialisation de mot de passe
async function sendWelcomeEmail(email: string, name: string) {
  try {
    // Utiliser le service_role_key pour avoir les permissions d'envoyer des emails
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Générer un lien de réinitialisation de mot de passe
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${supabaseUrl}/reset-password`,
      },
    });

    if (error) {
      throw error;
    }

    // Récupérer le lien généré
    const resetPasswordUrl = data?.properties?.action_link;

    if (!resetPasswordUrl) {
      throw new Error('Impossible de générer un lien de réinitialisation');
    }

    // Envoyer l'email de bienvenue
    const emailResult = await supabase
      .from('emails')
      .insert({
        email,
        subject: 'Bienvenue sur CREHO - Configurez votre mot de passe',
        content: `
          <h1>Bienvenue sur CREHO, ${name}!</h1>
          <p>Un compte a été créé pour vous dans le système de gestion CREHO.</p>
          <p>Veuillez configurer votre mot de passe en cliquant sur le lien ci-dessous:</p>
          <p><a href="${resetPasswordUrl}">Configurer mon mot de passe</a></p>
          <p>Ce lien expirera dans 24 heures.</p>
          <p>Si vous n'avez pas demandé ce compte, veuillez ignorer cet email.</p>
        `,
      });

    return { success: true, data: data };
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email:', err);
    return { success: false, error: err.message };
  }
}

// Gestionnaire de la requête
Deno.serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Vérifier que c'est une requête POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Méthode non supportée'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Extraire le corps de la requête
    const { email, name } = await req.json();

    // Vérifier que les champs requis sont présents
    if (!email || !name) {
      return new Response(JSON.stringify({
        error: 'Les champs email et name sont requis'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Envoyer l'email de bienvenue
    const result = await sendWelcomeEmail(email, name);

    if (!result.success) {
      return new Response(JSON.stringify({
        error: result.error
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Réponse réussie
    return new Response(JSON.stringify({
      message: 'Email de bienvenue envoyé avec succès',
      data: result.data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return new Response(JSON.stringify({
      error: 'Erreur serveur: ' + error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
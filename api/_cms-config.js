// Konfiguracja CMS TeamBudget — edycja tresci stron TB w repo r352.
// Wymagane env (Vercel → Settings → Environment Variables):
//   GITHUB_TOKEN  — Personal Access Token z uprawnieniem contents:write
//   GITHUB_REPO   — "reszkovy/r352"
//   CMS_PASSWORD  — haslo logowania do panelu /cms
// Opcjonalnie: GITHUB_BRANCH (domyslnie "main")

export const SITE_URL = 'https://betterguide.pl';

// Strony edytowalne w CMS
export const PAGES = {
  // wzorzec wykluczajacy pliki z panelu
  excludePattern: /^(cms|admin|404|index2?)\.html$/,
  // grupy stron w selectbox
  groups: {
    'TeamBudget': /^tb-/,
    'Design System': /^design-system/,
    'BetterWorkplace': /^bw-/,
    'DailyFruits': /^df-/,
    'Inne': /.*/
  }
};

// Upload
export const UPLOAD = {
  allowedExt: /\.(webp|jpg|jpeg|png|svg|avif)$/,
  maxBase64Bytes: 6 * 1024 * 1024,
};

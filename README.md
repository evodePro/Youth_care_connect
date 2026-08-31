# YouthCare Connect

A safe, anonymous platform connecting rural youth with professional advisors and health guidance without judgment.

## Features

- **Anonymous Chat:** Secure, real-time messaging with verified health advisors and peer educators using Supabase. No email or signup is required to join a chat.
- **Cycle Tracker:** A private tool to help youth understand and track their menstrual cycle.
- **Health Quizzes & Articles:** Interactive resources on mental health, reproductive health, relationships, and puberty.
- **Directory:** A list of verified specialists and health facilities for guidance and referral.
- **100% Privacy Guarantee:** Complete anonymity for youth. Chat histories are secured using enterprise-grade infrastructure.

## Technologies Used

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript
- **Backend / Real-time Database:** [Supabase](https://supabase.com) (with Row Level Security enabled for strict privacy)
- **Animations:** [GSAP](https://gsap.com) for smooth scroll and UI animations
- **Hosting:** [Netlify](https://www.netlify.com)

## Live Site

**🌍 [Visit YouthCare Connect](https://youth-care-connect.netlify.app/)**

## Local Development

If you want to run this project locally on your machine:

1. Clone this repository:
   ```bash
   git clone https://github.com/evodePro/Youth_care_connect.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Youth_care_connect
   ```
3. Open `index.html` directly in your browser, or start a local server (for example, using VS Code Live Server or Python):
   ```bash
   python -m http.server 8000
   ```
4. *Note: The anonymous chat feature requires a valid Supabase configuration in `supabase-config.js` to connect to the backend.*

## SEO Configuration

This project is configured with search engine optimization in mind:
- Includes SEO meta tags (Description, Keywords, Viewport).
- `robots.txt` explicitly allows search engine crawling.
- `sitemap.xml` provides Google with a directory of all available pages for faster indexing.

## License

All rights reserved. Designed to empower and support youth.

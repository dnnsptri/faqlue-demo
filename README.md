# FAQlue Demo

A Next.js demo application for FAQ management with Supabase integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   Create a `.env.local` file in the root directory with:
   ```
   FAQ_PUBLIC_FN_URL=https://your-project-ref.functions.supabase.co/faq-public
   FAQ_PUBLIC_TOKEN=
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Features

- FAQ display with search functionality
- Supabase Edge Function integration
- Responsive design with Tailwind CSS
- Custom ordering of FAQ items

## Environment Variables

- `FAQ_PUBLIC_FN_URL`: URL to your Supabase Edge Function
- `FAQ_PUBLIC_TOKEN`: Optional authentication token for the function

## Development

The application will work without the environment variables set, but will show an empty FAQ list. To see actual FAQ data, configure the Supabase function URL.

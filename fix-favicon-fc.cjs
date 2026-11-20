const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('[DIR] Criado: ' + path.relative(process.cwd(), dirPath));
  }
}

function writeFileSafe(relativePath, content) {
  const fullPath = path.join(__dirname, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
  console.log('[FILE] Atualizado: ' + relativePath);
}

const fcSvgIcon = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">',
  '  <rect x="2" y="2" width="60" height="60" rx="16" fill="#0B1120"/>',
  '  <text x="32" y="40" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-weight="800" font-size="25" letter-spacing="-0.5">FC</text>',
  '</svg>',
].join('\n') + '\n';

function run() {
  console.log('Configurando icone vetorial FC (src/app/icon.svg + public/fc-icon.svg) e atualizando metadata...\n');

  writeFileSafe('src/app/icon.svg', fcSvgIcon);
  writeFileSafe('public/fc-icon.svg', fcSvgIcon);

  const layoutPath = path.join(__dirname, 'src', 'app', 'layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    const newLayout = [
      "import type { Metadata } from 'next';",
      "import './globals.css';",
      '',
      'export const metadata: Metadata = {',
      "  title: 'FC Studio | Engenharia Web & Sites Sob Medida',",
      "  description: 'Sites sob medida, rápidos e blindados em segurança com arquitetura modular e suporte direto.',",
      '  icons: {',
      '    icon: [',
      "      { url: '/fc-icon.svg?v=2', type: 'image/svg+xml' },",
      "      { url: '/favicon.ico?v=2' },",
      '    ],',
      "    shortcut: '/fc-icon.svg?v=2',",
      "    apple: '/fc-icon.svg?v=2',",
      '  },',
      '};',
      '',
      'export default function RootLayout({',
      '  children,',
      '}: Readonly<{',
      '  children: React.ReactNode;',
      '}>) {',
      '  return (',
      '    <html lang="pt-BR">',
      '      <body className="antialiased bg-white text-slate-950">{children}</body>',
      '    </html>',
      '  );',
      '}',
    ].join('\n') + '\n';

    writeFileSafe('src/app/layout.tsx', newLayout);
    console.log('\nConcluido! Agora envie o commit para o GitHub para a Vercel atualizar.');
    return;
  }

  let layoutContent = fs.readFileSync(layoutPath, 'utf8');

  const iconsReplacement = [
    '  icons: {',
    '    icon: [',
    "      { url: '/fc-icon.svg?v=2', type: 'image/svg+xml' },",
    "      { url: '/favicon.ico?v=2' },",
    '    ],',
    "    shortcut: '/fc-icon.svg?v=2',",
    "    apple: '/fc-icon.svg?v=2',",
    '  },',
  ].join('\n');

  const existingIconsBlockRegex = /\s*icons:\s*\{[\s\S]*?\n\s*\},?/;
  if (existingIconsBlockRegex.test(layoutContent)) {
    layoutContent = layoutContent.replace(existingIconsBlockRegex, '\n' + iconsReplacement);
    writeFileSafe('src/app/layout.tsx', layoutContent);
  } else {
    const metadataRegex = /(export const metadata:\s*Metadata\s*=\s*\{)([\s\S]*?)(\n\};)/;
    if (metadataRegex.test(layoutContent)) {
      layoutContent = layoutContent.replace(metadataRegex, (_, openBlock, body, closeBlock) => {
        const trimmedBody = body.replace(/\s*$/, '');
        const needsComma = trimmedBody.trim().length > 0 && !trimmedBody.trim().endsWith(',');
        return `${openBlock}${trimmedBody}${needsComma ? ',' : ''}\n${iconsReplacement}${closeBlock}`;
      });
      writeFileSafe('src/app/layout.tsx', layoutContent);
    } else {
      console.warn('[AVISO] Nao foi possivel localizar export const metadata em src/app/layout.tsx.');
    }
  }

  console.log('\nConcluido! Execute git add, git commit e git push para publicar na Vercel.');
}

run();
# Studio Siler

Site de uma página do Studio Siler (cílios e sobrancelhas, Vila Velha/ES). HTML, CSS e JavaScript puros, sem build.

## Rodar localmente
Abra o `index.html` no navegador, ou rode um servidor simples na pasta:

    python3 -m http.server 8000

e acesse http://localhost:8000.

## Publicar
É um site estático. Funciona no GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root), na Netlify, na Vercel ou no Cloudflare Pages.

## Estrutura
- `index.html`: todo o site (estilos e scripts incluídos)
- `img/`: fotos, grafismos e símbolo da marca

## Pendências antes de ir ao ar de verdade
- O agendamento é uma prévia: os horários ficam salvos só no navegador de quem usa (localStorage) e não chegam à Julia. Falta um backend ou o envio pelo WhatsApp.
- A chave pix (`PIX_CHAVE`) e o nome do recebedor (`PIX_NOME`) no script são fictícios. Trocar pelos reais.
- Confirmar com a Julia: valores de manutenção, preços dos combos e preço/tempo do efeito wispy.
- Política de privacidade (LGPD), pois o formulário coleta nome e telefone.
- Para o link ficar com prévia bonita no WhatsApp, adicionar `og:image` com URL absoluta depois de publicar.

## Paleta
Roxos `#40354B` `#A390BE` `#B9A9C3` · Verdes `#89937B` `#CFDDBC` `#E3EED1` · Neutros `#EDE6D5` `#F7F0E2` `#FDF8EB`

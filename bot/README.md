# 🤖 Bot de agendamento — Studio Siler

> Esta pasta fica dentro do repositório do site, mas o bot **não roda no GitHub Pages**: ele roda num computador ou VPS ligado 24h (seção 7). O site continua estático.

Bot que atende pelo **WhatsApp do salão**:

1. A cliente manda mensagem → escolhe **serviço → dia → horário** → informa o nome.
2. A **dona recebe o pedido no WhatsApp dela** e responde `SIM 12` ou `NAO 12 motivo`.
3. A cliente recebe a **confirmação** (ou a recusa, com opção de escolher outro horário).
4. **24h antes**, a cliente recebe um **lembrete** e responde `1` (confirmo) ou `2` (cancelar). A dona é avisada da resposta.
5. Se a cliente não responder até 3h antes, a dona recebe um alerta.

Também tem: consultar/cancelar agendamentos, tabela de serviços, pedido para falar com a equipe, horário de almoço, dias fechados e lembrete para a dona quando ela esquece de responder um pedido.

---

## 1. O que você precisa

- Um computador que fique **ligado o tempo todo** (PC do salão, notebook velho, Raspberry Pi ou um servidor/VPS barato).
- **Node.js 20 ou mais novo** → https://nodejs.org (baixe a versão LTS).
- O **celular com o WhatsApp do salão** (de preferência WhatsApp Business).
- O **número pessoal da dona** — tem que ser **diferente** do número do salão, porque é por ele que ela recebe os pedidos e responde SIM/NAO.

## 2. Instalar

Abra o terminal (no Windows: PowerShell) dentro da pasta do bot e rode:

```bash
npm install
```

## 3. Configurar (`config.json`)

Abra o `config.json` num editor de texto e ajuste:

| Campo | O que é |
|---|---|
| `numerosDona` | Número(s) que recebem os pedidos e podem dar os comandos (SIM/NAO...). Formato: `55` + DDD + número, só dígitos. Pode ter mais de um (ex.: Julia e recepcionista). **Já vem com o próprio número do salão** (veja abaixo). |
| `nomeDona` | Nome usado nas mensagens ("Assim que a Julia confirmar..."). |
| `sinalPercentual`, `pix` | Sinal cobrado e chave pix enviada a quem agenda pelo WhatsApp. **Troque a chave fictícia pela real** (a do site também é fictícia). |
| `horasCancelamentoSemPerda` | Regra do site: cancelar com menos de 48h não devolve o sinal. O bot avisa isso ao cancelar. |
| `endereco` | Aparece na confirmação e no lembrete. |
| `servicos` | Iguais ao catálogo do site: `duracao` = tempo bloqueado na agenda (minutos), `rotulo` = tempo mostrado ("2h40 a 3h"), `preco`. **O `id` precisa ser o mesmo do site** (manutenção usa `manutencao-cilios-1/2/3`, uma para cada faixa de fios). Se mudar um preço ou tempo no site, mude aqui também. |
| `horarios` | Abertura e fechamento de cada dia. `null` = fechado. |
| `pausas` | Intervalos sem atendimento (almoço). |
| `datasFechadas` | Feriados/folgas fixos (`AAAA-MM-DD`). Dá para fechar dias pelo WhatsApp também (ver abaixo). |
| `intervaloMinutos` | De quanto em quanto tempo os horários são oferecidos (30 = 09:00, 09:30...). |
| `atendimentosSimultaneos` | Quantas clientes podem ser atendidas ao mesmo tempo (1 = uma profissional). |
| `antecedenciaMinimaHoras` | Antecedência mínima para agendar. |
| `lembreteHorasAntes` | Quando mandar o lembrete (24). |
| `avisarDonaSemConfirmacaoHorasAntes` | Alerta para a dona se a cliente não confirmou (3). |
| `lembrarDonaPedidoPendenteMinutos` | Reenvia o pedido para a dona se ela não respondeu (60). |
| `minutosAtendimentoHumano` | Quanto tempo o bot fica quieto quando a cliente pede para falar com a equipe (120). |

Os textos das mensagens ficam em `src/mensagens.js`, é só editar.

### A Julia usa o mesmo celular do salão?

Do jeito que vem configurado (`numerosDona` = número do salão), os pedidos chegam na conversa **"Você"** do próprio WhatsApp do salão (a conversa de mensagem para si mesmo), e é ali que a Julia responde `SIM 12`, `AGENDA` etc. Comprovantes não são reencaminhados nesse caso, porque ela já vê a foto na conversa da cliente.

Se ela preferir receber no WhatsApp pessoal, troque pelo número dela: `"numerosDona": ["55279XXXXXXXX"]`. Aí os comprovantes também são encaminhados para lá.

## 4. Testar sem WhatsApp (simulador)

```bash
npm run simular
```

Você digita como se fosse a cliente. Para falar como a dona, comece com `d:` (ex.: `d: sim 1`). Para outra cliente, `c2:`. Para avançar o relógio e ver o lembrete chegando: `+24h`, `+1d`, `+30min`.

Testes automáticos: `npm test`.

## 5. Ligar no WhatsApp do salão

```bash
npm start
```

Vai aparecer um **QR code** no terminal. No celular do salão: **WhatsApp → ⋮ / Configurações → Dispositivos conectados → Conectar dispositivo** e escaneie.

Se o QR não ficar legível, use o código de pareamento:

```bash
# Linux/Mac
NUMERO_SALAO=5527988009451 npm start
# Windows (PowerShell)
$env:NUMERO_SALAO="5527988009451"; npm start
```

Aparece um código de 8 letras → no celular: **Dispositivos conectados → Conectar dispositivo → Conectar com número de telefone**.

A sessão fica salva na pasta `auth/` — não precisa escanear de novo. Os agendamentos ficam em `data/db.json` (faça backup de vez em quando).

### Deixar rodando 24h

```bash
npm install -g pm2
pm2 start src/index.js --name studio-siler
pm2 save
pm2 startup      # faz o bot voltar sozinho quando o computador reiniciar
pm2 logs studio-siler   # ver o que está acontecendo
```

> Na primeira vez, rode com `npm start` para escanear o QR; depois pare (Ctrl+C) e suba com o pm2.

## 6. Como o bot conversa com o site

O site continua estático: ele não chama o bot, só abre o WhatsApp do salão com uma mensagem pronta, e o bot responde.

**Formulário de agendamento do site.** No fim do formulário, a cliente toca em "Enviar comprovante pelo WhatsApp". A mensagem já vai com nome, serviço, dia, sinal e uma linha `Ref:` (data completa, duração e id do serviço) para o bot ler. O bot então:

1. confere o horário na **agenda real** (o site sozinho só enxerga os agendamentos feitos no próprio navegador da cliente, então duas clientes poderiam pegar o mesmo horário);
2. se estiver livre, cria o pedido e avisa a Julia com o valor do sinal; se estiver ocupado, pede para a cliente escolher outro dia/horário e avisa a Julia;
3. quando a cliente manda a **foto/PDF do comprovante**, encaminha para a Julia;
4. a Julia responde `SIM 12` / `NAO 12` e o resto segue igual (confirmação, lembrete de 24h).

Mensagens repetidas não duplicam o pedido. Se a mensagem vier sem a linha `Ref:` (site antigo em cache), o bot entende pelas outras linhas.

**Link "Outro horário? Chama a Julia no WhatsApp".** Vai direto para atendimento humano: o bot avisa a Julia e fica quieto naquela conversa.

**Links com "Quero agendar".** Qualquer link `https://wa.me/5527988009451?text=Quero agendar...` pula o menu e mostra os serviços. Se o texto tiver o nome exato do serviço (ex.: `Quero agendar Lash lifting`), o bot vai direto para a escolha do dia.

## 7. Hospedar na Hostinger

**Atenção:** a hospedagem comum da Hostinger (planos de site, incluindo os "Web Apps" Node.js do plano Business/Cloud) **não serve para o bot**: lá o app é desligado quando fica sem visitas e não aceita processos rodando o tempo todo. O bot precisa de uma **VPS** (o plano KVM 1 já sobra).

### 7.1 Bot na VPS (KVM 1)

1. Contrate a VPS escolhendo **datacenter no Brasil** e o sistema **Ubuntu 24.04** (o modelo "puro", sem painel).
2. Defina a senha de root no painel da VPS e acesse pelo **terminal do navegador** do painel, ou do seu computador: `ssh root@IP_DA_VPS`.
3. Instale o Node.js e utilitários:
   ```bash
   apt update && apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt install -y nodejs git
   timedatectl set-timezone America/Sao_Paulo
   ```
4. Baixe o bot direto do GitHub:
   ```bash
   cd /root && git clone https://github.com/agssmarcela/StudioSiler.git
   cd StudioSiler/bot
   npm install --omit=dev
   nano config.json        # confira número da dona, chave pix etc. (Ctrl+O salva, Ctrl+X sai)
   ```
   Para atualizar depois de uma mudança no GitHub: `cd /root/StudioSiler && git pull && cd bot && npm install --omit=dev && pm2 restart studio-siler`. Se você editou o `config.json` na VPS, o `git pull` pode reclamar: guarde a sua versão com `git stash`, faça o pull e depois `git stash pop`.
5. Conecte o WhatsApp. O QR code costuma ficar ilegível no terminal do navegador, então prefira o código de pareamento:
   ```bash
   NUMERO_SALAO=5527988009451 npm start
   ```
   Digite o código no celular do salão (Dispositivos conectados → Conectar com número de telefone). Quando aparecer "✅ Conectado", aperte Ctrl+C.
6. Deixe rodando para sempre:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name studio-siler
   pm2 save && pm2 startup
   ```
7. **Firewall:** o bot só faz conexões de saída, não precisa abrir nenhuma porta. No firewall da VPS, deixe liberada só a porta 22 (SSH).
8. **Backup:** as pastas que importam são `data/` (agendamentos) e `auth/` (login do WhatsApp). Ative os backups/snapshots da VPS no painel.

Comandos úteis: `pm2 logs studio-siler` (ver o que está acontecendo), `pm2 restart studio-siler` (depois de editar o `config.json`).

### 7.2 Site

Escolha uma das opções:

- **Manter no GitHub Pages (grátis)** e só apontar o domínio: na zona DNS do domínio, crie registros **A** para `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` e um **CNAME** `www` → `agssmarcela.github.io`. No GitHub: repositório → Settings → Pages → Custom domain, e marque "Enforce HTTPS".
- **Hospedagem de sites da Hostinger** (o plano mais simples basta para um site estático): envie os arquivos para a pasta `public_html` pelo gerenciador de arquivos (ou conecte o repositório do GitHub pela opção Git do painel), ative o **SSL grátis** e force HTTPS.
- **Tudo na VPS:** dá para servir o site na própria VPS com Nginx + Certbot (SSL). Economiza um plano, mas dá mais trabalho de manutenção.

## 8. Comandos da dona (na conversa "Você" do salão, ou do WhatsApp dela para o número do salão)

| Comando | O que faz |
|---|---|
| `SIM 12` | Confirma o pedido #12 e avisa a cliente |
| `NAO 12 motivo` | Recusa o #12 (motivo é opcional) |
| `SIM` / `NAO` | Funciona sem número quando só há um pedido pendente |
| `PENDENTES` | Lista pedidos aguardando resposta |
| `AGENDA` / `AGENDA AMANHA` / `AGENDA 28/11` | Agenda do dia |
| `CANCELAR 12 motivo` | Cancela um agendamento já confirmado e avisa a cliente |
| `FECHAR 24/12` / `ABRIR 24/12` | Bloqueia/libera um dia inteiro |
| `AJUDA` | Mostra os comandos |

## 9. Atendimento humano

- Se a cliente escolher **5 - Falar com a equipe**, a dona é avisada e o bot para de responder aquela cliente por 2h (ou até ela digitar `menu`).
- Se alguém da equipe **responder a cliente direto pelo celular do salão**, o bot percebe e também fica quieto naquela conversa por 2h. Assim ele não atropela uma conversa humana.

## ⚠️ Importante

- Este bot usa o **WhatsApp Web** (biblioteca Baileys), que **não é a API oficial**. O WhatsApp pode bloquear números que usam automação de forma abusiva. Para reduzir o risco: o bot só **responde** quem chama (não dispara mensagens em massa), simula "digitando..." e só envia lembretes para quem agendou. Mesmo assim, use por sua conta e risco.
- Se o salão crescer ou quiser zero risco, o caminho é a **API oficial do WhatsApp Business (Meta Cloud API)** — exige cadastro na Meta, cobra por mensagem e o lembrete precisa de um modelo aprovado. Só o arquivo `src/whatsapp.js` precisaria ser trocado; o resto do bot continua igual.
- O computador precisa estar ligado e com internet. Se ele ficar desligado, os lembretes atrasados são enviados assim que o bot voltar (desde que ainda não tenha passado o horário).

## Estrutura

```
config.json         configurações do salão
src/index.js        inicia o bot no WhatsApp
src/whatsapp.js     conexão com o WhatsApp (Baileys)
src/bot.js          conversa, comandos da dona e lembretes
src/agenda.js       cálculo de horários livres
src/mensagens.js    todos os textos
src/site.js         leitura da mensagem que vem do formulário do site
src/store.js        banco de dados em JSON (data/db.json)
src/simulador.js    teste no terminal
test/               testes automáticos
```

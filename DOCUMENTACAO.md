# 📚 Documentação Shalom Learning - Guia de Modificação

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Como Modificar Conteúdo](#como-modificar-conteúdo)
4. [Como Modificar Design](#como-modificar-design)
5. [Como Adicionar/Editar Cursos](#como-adicionareditar-cursos)
6. [Como Modificar Traduções](#como-modificar-traduções)
7. [Como Modificar Código PIX](#como-modificar-código-pix)
8. [Como Trocar Vídeos das Aulas](#como-trocar-vídeos-das-aulas)
9. [Sistema de Códigos de Acesso](#sistema-de-códigos-de-acesso)
10. [Testes e Verificação](#testes-e-verificação)

---

## 🎯 Visão Geral

O **Shalom Learning** é uma plataforma educacional completa com:
- ✅ 10 cursos (6 de tecnologia + 4 de idiomas)
- ✅ 20 aulas por curso com vídeos do YouTube
- ✅ Sistema de autenticação (login/cadastro)
- ✅ Suporte a 5 idiomas (PT, EN, FR, ES, Creole Haitiano)
- ✅ Pagamento via PIX com upload de comprovante
- ✅ **Código de acesso único por compra** (novo!)
- ✅ FAQ completo
- ✅ Design moderno e minimalista

---

## 📁 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py          # API principal (cursos, autenticação, pagamentos)
│   ├── .env              # Configurações do backend
│   └── requirements.txt   # Dependências Python
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas principais
│   │   │   ├── Home.js           # Página inicial
│   │   │   ├── Login.js          # Página de login
│   │   │   ├── Signup.js         # Página de cadastro
│   │   │   ├── CourseDetail.js   # Detalhes do curso com vídeos
│   │   │   ├── Checkout.js       # Pagamento PIX
│   │   │   └── MyCourses.js      # Meus cursos comprados
│   │   │
│   │   ├── components/    # Componentes reutilizáveis
│   │   │   ├── Header.js         # Cabeçalho com navegação
│   │   │   ├── CourseCard.js     # Card de curso
│   │   │   ├── FAQ.js            # Perguntas frequentes
│   │   │   └── ui/               # Componentes Shadcn
│   │   │
│   │   ├── contexts/      # Gerenciamento de estado
│   │   │   ├── AuthContext.js    # Autenticação
│   │   │   └── LanguageContext.js # Idiomas
│   │   │
│   │   ├── utils/
│   │   │   └── translations.js   # Todas as traduções
│   │   │
│   │   ├── App.js         # Rotas principais
│   │   ├── App.css        # Estilos globais
│   │   └── index.css      # Estilos Tailwind
│   │
│   ├── .env              # Configurações do frontend
│   └── package.json       # Dependências JavaScript
```

---

## 📝 Como Modificar Conteúdo

### 1. **Modificar Textos da Página Inicial**

**Arquivo:** `/app/frontend/src/utils/translations.js`

Para mudar o título ou subtítulo da página:

```javascript
// Linha ~7-9 (Português)
heroTitle: 'Transforme sua Carreira com',
heroTitleHighlight: 'Shalom Learning',
heroSubtitle: 'Cursos de tecnologia e idiomas para brasileiros...',
```

### 2. **Modificar Informações de Contato**

**Arquivo:** `/app/frontend/src/pages/Home.js`

```javascript
// Linha ~165-167 (Footer)
<p>Telefone: <a href="tel:+5511970561970">11 97056-1970</a></p>
<p>Email: <a href="mailto:jeanmaryjeanlus29@gmail.com">jeanmaryjeanlus29@gmail.com</a></p>
```

### 3. **Modificar Link "Mais Informações"**

**Arquivo:** `/app/frontend/src/components/Header.js`

```javascript
// Linha ~48-52
<a 
  href="https://jeanmaryshalomboot.streamlit.app" 
  target="_blank"
>
```

---

## 🎨 Como Modificar Design

### 1. **Cores Principais**

**Arquivo:** `/app/frontend/src/index.css`

```css
/* Linha ~23 (Cor primária - Violeta) */
--primary: 262.1 83.3% 57.8%;  /* Violeta atual */

/* Para mudar para azul, por exemplo: */
--primary: 217 91% 60%;
```

### 2. **Fontes**

**Arquivo:** `/app/frontend/src/App.css`

```css
/* Linha 1 */
@import url('https://fonts.googleapis.com/css2?family=Outfit...');

/* Mudar fonte principal: */
@import url('https://fonts.googleapis.com/css2?family=Poppins...');
```

### 3. **Espaçamentos**

**Arquivo:** Design guidelines em `/app/design_guidelines.json`

```json
"spacing": {
  "container_padding": "px-6 md:px-12 lg:px-24",
  "section_gap": "py-20 md:py-32"
}
```

---

## 📚 Como Adicionar/Editar Cursos

### **Localização:** `/app/backend/server.py`

**Encontre a variável `COURSES_DATA` (linha ~127)**

#### Para Adicionar um Novo Curso:

```python
{
    "id": "novo-curso-id",  # ID único (use kebab-case)
    "title": "Nome do Curso",
    "category": "Tecnologia",  # Ou "Idiomas"
    "description": "Descrição detalhada do curso",
    "price": 297.00,
    "thumbnail": "https://images.unsplash.com/photo-xxxxx?w=800",
    "language": "pt",
    "lessons": [
        {
            "id": f"novo-lesson-{i}",
            "title": f"Aula {i}: Título da Aula",
            "videoUrl": "https://www.youtube.com/embed/VIDEO_ID",
            "duration": "20:00",
            "order": i
        }
        for i in range(1, 21)  # 20 aulas
    ]
}
```

#### Para Editar um Curso Existente:

```python
# Exemplo: Mudar preço do curso de Python
{
    "id": "python-basics",
    "title": "Python para Iniciantes",
    "price": 250.00,  # ← Mude aqui
    ...
}
```

**⚠️ IMPORTANTE:** Após modificar, reinicie o backend:
```bash
sudo supervisorctl restart backend
```

---

## 🌍 Como Modificar Traduções

**Arquivo:** `/app/frontend/src/utils/translations.js`

### Estrutura:

```javascript
export const translations = {
  pt: { /* Português */ },
  en: { /* English */ },
  fr: { /* Français */ },
  es: { /* Español */ },
  ht: { /* Haitian Creole */ }
};
```

### Para Adicionar Nova Tradução:

```javascript
// 1. Adicione a chave em TODOS os idiomas
pt: {
  newKey: 'Novo texto em português',
  ...
},
en: {
  newKey: 'New text in English',
  ...
}

// 2. Use no código:
const { t } = useLanguage();
<p>{t('newKey')}</p>
```

### Para Modificar Tradução Existente:

```javascript
// Exemplo: Mudar texto do botão "Comprar Agora"
pt: {
  buyNow: 'Adquirir Curso',  // ← Altere aqui
}
```

---

## 💳 Como Modificar Código PIX

### **Método 1: Variável Global (Recomendado)**

**Arquivo:** `/app/backend/server.py`

```python
# Linha ~366
PIX_CODE = "SEU_NOVO_CODIGO_PIX_AQUI"
```

### **Método 2: Também no Frontend**

**Arquivo:** `/app/frontend/src/pages/Checkout.js`

```javascript
// Linha 10
const PIX_CODE = "SEU_NOVO_CODIGO_PIX_AQUI";
```

**⚠️ Reinicie ambos os serviços após modificar:**
```bash
sudo supervisorctl restart backend frontend
```

---

## 🎥 Como Trocar Vídeos das Aulas

### 1. **Obter URL do YouTube**

1. Vá para o vídeo no YouTube
2. Clique em "Compartilhar" → "Incorporar"
3. Copie apenas o ID do vídeo (parte após `/embed/`)

Exemplo:
- URL completo: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- ID do vídeo: `dQw4w9WgXcQ`
- URL para usar: `https://www.youtube.com/embed/dQw4w9WgXcQ`

### 2. **Substituir no Código**

**Arquivo:** `/app/backend/server.py`

```python
# Encontre o curso desejado em COURSES_DATA
{
    "id": "python-basics",
    ...
    "lessons": [
        {
            "id": f"py-lesson-{i}",
            "title": f"Aula {i}: Fundamentos Python",
            "videoUrl": "https://www.youtube.com/embed/NOVO_VIDEO_ID",  # ← Mude aqui
            "duration": "15:00",
            "order": i
        }
        for i in range(1, 21)
    ]
}
```

### 3. **Substituir Vídeos Individuais**

Para vídeos específicos (não usar loop):

```python
"lessons": [
    {
        "id": "py-lesson-1",
        "title": "Aula 1: Introdução ao Python",
        "videoUrl": "https://www.youtube.com/embed/VIDEO_ID_1",
        "duration": "15:00",
        "order": 1
    },
    {
        "id": "py-lesson-2",
        "title": "Aula 2: Variáveis e Tipos",
        "videoUrl": "https://www.youtube.com/embed/VIDEO_ID_2",
        "duration": "18:00",
        "order": 2
    },
    # ... continue para as 20 aulas
]
```

**⚠️ Reinicie o backend:**
```bash
sudo supervisorctl restart backend
```

---

## 🔑 Sistema de Códigos de Acesso

### O que é?

Após o usuário enviar o comprovante de pagamento PIX, o sistema automaticamente gera um **código de acesso único** para aquele curso específico.

### Formato do Código

Os códigos seguem o padrão: `SHL-[CURSO]-[RANDOM]`

Exemplos:
- `SHL-PYTHON-A1B2C3` (Python)
- `SHL-EXCELM-X9Y8Z7` (Excel)
- `SHL-FRENCH-K5L6M7` (Francês)

### Como Funciona

1. **Usuário compra curso** → Envia comprovante PIX
2. **Sistema gera código** → Código único é criado automaticamente
3. **Tela de sucesso** → Código é exibido imediatamente após pagamento
4. **Meus Cursos** → Todos os códigos ficam disponíveis na página "Meus Cursos"

### Onde Ver os Códigos

**Localização:** Página "Meus Cursos" (`/my-courses`)

Os códigos aparecem em cards coloridos no topo da página, mostrando:
- Nome do curso
- Código de acesso
- Status do pagamento (Pendente/Aprovado)
- Miniatura do curso

### Como Modificar a Geração de Códigos

**Arquivo:** `/app/backend/server.py` (linha ~130)

```python
def generate_access_code(course_id: str) -> str:
    """Generate unique access code for a course purchase"""
    prefix = "SHL"  # ← Mude o prefixo aqui
    course_code = course_id.upper().replace("-", "")[:6]
    random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{course_code}-{random_code}"
```

**Personalizações possíveis:**

```python
# Exemplo 1: Mudar prefixo
prefix = "CURSO"  # Resultado: CURSO-PYTHON-A1B2C3

# Exemplo 2: Código mais curto
random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
# Resultado: SHL-PYTHON-A1B2

# Exemplo 3: Apenas números
random_code = ''.join(random.choices(string.digits, k=8))
# Resultado: SHL-PYTHON-12345678
```

### API Endpoints para Códigos

**1. Criar pagamento e gerar código:**
```bash
POST /api/payments/create
Headers: Authorization: Bearer [TOKEN]
Body: {
  "courseId": "python-basics",
  "receiptData": "base64_encoded_image"
}

Response: {
  "success": true,
  "accessCode": "SHL-PYTHON-A1B2C3",
  "courseTitle": "Python para Iniciantes",
  "message": "Comprovante enviado com sucesso!"
}
```

**2. Listar todos os códigos do usuário:**
```bash
GET /api/my-access-codes
Headers: Authorization: Bearer [TOKEN]

Response: [
  {
    "accessCode": "SHL-PYTHON-A1B2C3",
    "courseId": "python-basics",
    "courseTitle": "Python para Iniciantes",
    "courseThumbnail": "https://...",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Banco de Dados

Os códigos são armazenados na coleção `payments`:

```javascript
{
  "id": "uuid",
  "userId": "user_uuid",
  "courseId": "python-basics",
  "pixCode": "PIX_CODE",
  "receiptData": "base64_image",
  "accessCode": "SHL-PYTHON-A1B2C3",  // ← Código único
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Fluxo Completo do Usuário

```
1. Usuário → Clica "Comprar Agora"
2. Sistema → Verifica se está logado
3. Usuário → Vai para página de Checkout
4. Usuário → Vê QR Code PIX
5. Usuário → Faz pagamento via PIX
6. Usuário → Faz upload do comprovante
7. Sistema → Gera código de acesso único
8. Usuário → Vê tela de sucesso com código
9. Usuário → Pode copiar o código
10. Usuário → Acessa "Meus Cursos" para ver todos os códigos
```

---

## 🧪 Testes e Verificação

### 1. **Verificar Status dos Serviços**

```bash
sudo supervisorctl status
```

Deve mostrar:
```
backend    RUNNING
frontend   RUNNING
mongodb    RUNNING
```

### 2. **Testar API**

```bash
curl https://course-hub-164.preview.emergentagent.com/api/courses
```

### 3. **Ver Logs em Caso de Erro**

```bash
# Backend
tail -f /var/log/supervisor/backend.err.log

# Frontend
tail -f /var/log/supervisor/frontend.err.log
```

### 4. **Reiniciar Serviços**

```bash
# Reiniciar tudo
sudo supervisorctl restart all

# Apenas backend
sudo supervisorctl restart backend

# Apenas frontend
sudo supervisorctl restart frontend
```

---

## 🚀 Workflow de Modificação

### Para Mudanças no Backend (cursos, API, pagamentos):
1. Edite `/app/backend/server.py`
2. Salve o arquivo
3. Execute: `sudo supervisorctl restart backend`
4. Aguarde 10 segundos
5. Teste a API ou o site

### Para Mudanças no Frontend (design, textos, páginas):
1. Edite os arquivos em `/app/frontend/src/`
2. Salve o arquivo
3. O hot reload é automático (aguarde 5-10 segundos)
4. Recarregue o navegador

### Para Mudanças em Traduções:
1. Edite `/app/frontend/src/utils/translations.js`
2. Salve o arquivo
3. Recarregue o navegador
4. Teste cada idioma no selector de idiomas

---

## 📞 Suporte

- **Email:** jeanmaryjeanlus29@gmail.com
- **Telefone:** 11 97056-1970
- **Info:** https://jeanmaryshalomboot.streamlit.app

---

## ✅ Checklist Rápido

Antes de fazer qualquer modificação:

- [ ] Faça backup do arquivo original
- [ ] Teste em ambiente de desenvolvimento
- [ ] Verifique os logs após modificar
- [ ] Teste em diferentes idiomas
- [ ] Teste em mobile e desktop
- [ ] Reinicie os serviços apropriados

---

**Última atualização:** Janeiro 2024
**Versão:** 1.0

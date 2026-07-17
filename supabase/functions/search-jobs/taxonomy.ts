export interface TaxonomyNode {
  id: string;
  department: string;
  aliases: string[];
  primary_titles: string[];
  secondary_titles: string[];
  related_titles: string[];
  negative_titles: string[];
  required_skills: string[];
  preferred_skills: string[];
  negative_keywords: string[];
  common_tools: string[];
  industry_terms: string[];
  seniority_aliases: Record<string, string[]>;
  location_aliases: Record<string, string[]>;
  language_variants: Record<string, string>;
  career_path: string[];
  similar_roles: string[];
  edges?: Record<string, number>; // Grafo direcionado ponderado: ID Canônico -> Fator de afinidade
}

export const LOCAL_TAXONOMY: Record<string, TaxonomyNode> = {
  "frontend_engineer": {
    id: "frontend_engineer",
    department: "Engineering",
    aliases: [
      "react developer", "frontend developer", "front-end developer", "ui engineer",
      "javascript engineer", "web engineer", "spa engineer", "desenvolvedor frontend",
      "desenvolvedor front-end", "programador front end", "dev front", "frontend developer",
      "desenvolvedora frontend", "desenvolvedora front-end", "react dev"
    ],
    primary_titles: ["frontend engineer", "react developer", "frontend developer", "front-end engineer", "desenvolvedor frontend"],
    secondary_titles: ["ui engineer", "javascript engineer", "web engineer", "spa engineer", "react dev", "dev front"],
    related_titles: ["fullstack_engineer", "mobile_engineer", "product_designer"],
    negative_titles: ["back-end", "backend", "java developer", "devops", "qa tester", "sql server", "c#", "dotnet"],
    required_skills: ["react", "typescript", "html", "css", "next.js", "javascript"],
    preferred_skills: ["nextjs", "vue", "angular", "vite", "sass", "tailwind", "jest", "cypress", "graphql", "redux", "zustand", "figma"],
    negative_keywords: ["back-end", "backend", "java developer", "devops", "qa tester", "sql server", "c#", "dotnet", "fullstack", "full stack"],
    common_tools: ["git", "npm", "yarn", "vite", "webpack", "vs code", "figma"],
    industry_terms: ["spa", "pwa", "responsive design", "design system", "headless cms"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "frontend engineer",
      "pt": "desenvolvedor front-end"
    },
    career_path: ["junior frontend developer", "frontend engineer", "senior frontend engineer", "frontend tech lead"],
    similar_roles: ["fullstack_engineer", "mobile_engineer"],
    edges: {
      "fullstack_engineer": 0.6,
      "mobile_engineer": 0.5,
      "product_designer": 0.3
    }
  },

  "backend_engineer": {
    id: "backend_engineer",
    department: "Engineering",
    aliases: [
      "backend developer", "backend engineer", "back-end developer", "back-end engineer",
      "desenvolvedor backend", "desenvolvedor back-end", "programador back end", "dev back",
      "node developer", "java developer", "python developer", "go developer", "php developer",
      "c# developer", "dotnet developer", "desenvolvedora backend", "desenvolvedora back-end"
    ],
    primary_titles: ["backend engineer", "backend developer", "back-end developer", "back-end engineer", "desenvolvedor backend"],
    secondary_titles: ["node developer", "java developer", "python developer", "go developer", "php developer", "c# developer", "dotnet developer"],
    related_titles: ["fullstack_engineer", "devops_engineer"],
    negative_titles: ["front-end", "frontend", "css", "html", "react developer", "figma", "designer", "ux", "ui designer"],
    required_skills: ["node.js", "python", "java", "postgresql", "mysql", "mongodb", "docker", "aws", "apis"],
    preferred_skills: ["kubernetes", "redis", "kafka", "graphql", "microservices", "gcp", "azure", "ci/cd", "serverless", "c#", "go", "php", "ruby"],
    negative_keywords: ["front-end", "frontend", "css", "html", "react developer", "figma", "designer", "ux", "ui designer"],
    common_tools: ["git", "docker", "postman", "kubernetes", "aws cli", "pm2"],
    industry_terms: ["rest api", "grpc", "orm", "microservices", "message queues", "caching"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "backend engineer",
      "pt": "desenvolvedor back-end"
    },
    career_path: ["junior backend developer", "backend engineer", "senior backend engineer", "backend tech lead"],
    similar_roles: ["fullstack_engineer", "devops_engineer"],
    edges: {
      "fullstack_engineer": 0.6,
      "devops_engineer": 0.5
    }
  },

  "fullstack_engineer": {
    id: "fullstack_engineer",
    department: "Engineering",
    aliases: [
      "fullstack developer", "fullstack engineer", "full-stack developer", "full-stack engineer",
      "desenvolvedor fullstack", "desenvolvedor full-stack", "dev fullstack", "dev full-stack",
      "programador fullstack", "desenvolvedora fullstack", "desenvolvedora full-stack"
    ],
    primary_titles: ["fullstack developer", "fullstack engineer", "full-stack developer", "full-stack engineer", "desenvolvedor fullstack"],
    secondary_titles: ["dev fullstack", "programador fullstack", "desenvolvedora fullstack"],
    related_titles: ["frontend_engineer", "backend_engineer"],
    negative_titles: ["qa tester", "designer gráfico", "recruiter", "sales representative", "telemarketing"],
    required_skills: ["react", "node.js", "typescript", "javascript", "postgresql", "html", "css", "apis"],
    preferred_skills: ["docker", "aws", "python", "next.js", "vue", "angular", "mongodb", "redis", "ci/cd", "kubernetes", "gcp", "graphql"],
    negative_keywords: ["qa tester", "designer gráfico", "recruiter", "sales representative", "telemarketing"],
    common_tools: ["git", "npm", "docker", "vscode", "postman"],
    industry_terms: ["full stack", "monolith", "serverless", "devops lite"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "fullstack engineer",
      "pt": "desenvolvedor fullstack"
    },
    career_path: ["junior fullstack engineer", "fullstack engineer", "senior fullstack engineer", "fullstack lead"],
    similar_roles: ["frontend_engineer", "backend_engineer"],
    edges: {
      "frontend_engineer": 0.7,
      "backend_engineer": 0.7
    }
  },

  "mobile_engineer": {
    id: "mobile_engineer",
    department: "Engineering",
    aliases: [
      "mobile developer", "mobile engineer", "ios developer", "android developer",
      "flutter developer", "react native developer", "desenvolvedor mobile", "dev mobile",
      "desenvolvedora mobile", "programador mobile"
    ],
    primary_titles: ["mobile developer", "mobile engineer", "desenvolvedor mobile", "react native developer", "ios developer", "android developer"],
    secondary_titles: ["flutter developer", "dev mobile", "programador mobile"],
    related_titles: ["frontend_engineer", "fullstack_engineer"],
    negative_titles: ["backend", "back-end", "desktop developer", "system administrator", "help desk"],
    required_skills: ["flutter", "react native", "swift", "kotlin", "mobile", "ios", "android"],
    preferred_skills: ["objective-c", "java", "dart", "xcode", "android studio", "app store", "google play", "firebase", "redux", "fastlane"],
    negative_keywords: ["backend", "back-end", "desktop developer", "system administrator", "help desk"],
    common_tools: ["xcode", "android studio", "firebase", "fastlane", "git"],
    industry_terms: ["app", "native", "cross-platform", "google play console", "app store connect"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "mobile engineer",
      "pt": "desenvolvedor mobile"
    },
    career_path: ["junior mobile developer", "mobile developer", "senior mobile engineer", "mobile tech lead"],
    similar_roles: ["frontend_engineer"],
    edges: {
      "frontend_engineer": 0.5
    }
  },

  "devops_engineer": {
    id: "devops_engineer",
    department: "Engineering",
    aliases: [
      "devops engineer", "devops specialist", "site reliability engineer", "sre",
      "cloud engineer", "infra engineer", "engenheiro devops", "analista de infraestrutura"
    ],
    primary_titles: ["devops engineer", "site reliability engineer", "sre", "cloud engineer", "devops specialist"],
    secondary_titles: ["infra engineer", "engenheiro devops", "analista de infraestrutura"],
    related_titles: ["backend_engineer", "technical_support"],
    negative_titles: ["front-end", "frontend", "react developer", "ui designer", "product manager", "designer gráfico"],
    required_skills: ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux"],
    preferred_skills: ["jenkins", "ansible", "bash", "python", "gcp", "azure", "prometheus", "grafana", "elk", "monitoring", "networking", "security"],
    negative_keywords: ["front-end", "frontend", "react developer", "ui designer", "product manager", "designer gráfico"],
    common_tools: ["kubernetes", "docker", "terraform", "ansible", "jenkins", "aws cli", "git"],
    industry_terms: ["infrastructure as code", "gitops", "pipelines", "high availability", "observability"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "devops engineer",
      "pt": "engenheiro devops"
    },
    career_path: ["cloud associate", "devops engineer", "senior devops engineer", "devops architect"],
    similar_roles: ["backend_engineer", "technical_support"],
    edges: {
      "backend_engineer": 0.4
    }
  },

  "qa_engineer": {
    id: "qa_engineer",
    department: "Engineering",
    aliases: [
      "qa engineer", "qa analyst", "test engineer", "quality assurance analyst",
      "analista de qa", "analista de testes", "engenheiro de qa", "qa tester"
    ],
    primary_titles: ["qa engineer", "qa analyst", "test engineer", "analista de qa", "quality assurance analyst"],
    secondary_titles: ["analista de testes", "engenheiro de qa", "qa tester"],
    related_titles: ["frontend_engineer", "backend_engineer", "technical_support"],
    negative_titles: ["desenvolvedor", "programmer", "sales", "hr recruiter", "marketing", "vendas"],
    required_skills: ["testing", "selenium", "cypress", "automation", "jest", "postman", "qa"],
    preferred_skills: ["playwright", "appium", "ci/cd", "sql", "performance testing", "load testing", "typescript", "bug tracking", "test cases"],
    negative_keywords: ["desenvolvedor", "programmer", "sales", "hr recruiter", "marketing", "vendas"],
    common_tools: ["selenium", "cypress", "playwright", "jira", "postman", "testrail"],
    industry_terms: ["regression testing", "sanity check", "end-to-end", "test automation", "manual testing"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "qa engineer",
      "pt": "analista de qa"
    },
    career_path: ["qa tester", "qa engineer", "senior qa specialist", "qa manager"],
    similar_roles: ["frontend_engineer", "backend_engineer"],
    edges: {
      "frontend_engineer": 0.3,
      "backend_engineer": 0.3
    }
  },

  "customer_success": {
    id: "customer_success",
    department: "Customer Service",
    aliases: [
      "customer success manager", "customer success specialist", "csm",
      "client success manager", "customer experience specialist", "cx",
      "customer onboarding specialist", "implementation consultant", "customer success engineer",
      "analista de customer success", "gerente de customer success", "especialista em cs",
      "customer experience", "client success", "client experience", "customer operations",
      "customer onboarding", "client success representative", "customer experience manager"
    ],
    primary_titles: ["customer success manager", "customer success specialist", "csm", "analista de customer success", "customer experience", "client success"],
    secondary_titles: ["client success manager", "customer experience specialist", "cx", "gerente de customer success", "especialista em cs", "client experience", "customer operations", "customer onboarding"],
    related_titles: ["technical_support", "sales_representative"],
    negative_titles: ["cold calling", "active sales", "telemarketing", "vendas ativas", "developer", "programmer", "designer", "engineer", "desenvolvedor", "desenvolvedora", "dev", "fullstack"],
    required_skills: ["crm", "nps", "csat", "retention", "churn management", "zendesk", "customer relationship"],
    preferred_skills: ["salesforce", "hubspot", "sql", "excel", "onboarding", "key accounts", "saas experience", "sucesso do cliente"],
    negative_keywords: ["cold calling", "active sales", "inside sales", "telemarketing", "vendas ativas", "quota", "developer", "designer", "engineer", "desenvolvedor", "desenvolvedora", "programador", "programmer", "dev", "fullstack"],
    common_tools: ["zendesk", "salesforce", "hubspot", "intercom", "gainsight"],
    industry_terms: ["churn", "retention rate", "customer health score", "upsell", "cross-sell", "onboarding"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "customer success manager",
      "pt": "gerente de customer success"
    },
    career_path: ["cs associate", "customer success manager", "senior csm", "head of customer success"],
    similar_roles: ["technical_support", "sales_representative"],
    edges: {
      "technical_support": 0.45,
      "sales_representative": 0.4
    }
  },

  "technical_support": {
    id: "technical_support",
    department: "Customer Service",
    aliases: [
      "support analyst", "technical support specialist", "helpdesk analyst", "it support engineer",
      "analista de suporte", "analista de suporte técnico", "suporte de ti", "help desk",
      "suporte n1", "suporte n2", "suporte n3", "customer support", "customer support agent",
      "technical support analyst"
    ],
    primary_titles: ["support analyst", "technical support specialist", "helpdesk analyst", "analista de suporte", "analista de suporte técnico", "customer support"],
    secondary_titles: ["it support engineer", "suporte de ti", "help desk", "suporte n1", "suporte n2", "suporte n3", "customer support agent", "technical support analyst"],
    related_titles: ["devops_engineer", "customer_success"],
    negative_titles: ["desenvolvedor", "developer", "designer", "product manager", "sales representative", "vendedor"],
    required_skills: ["helpdesk", "troubleshooting", "hardware", "software", "windows", "linux", "networks", "support"],
    preferred_skills: ["active directory", "sql", "itsm", "itil", "dns", "dhcp", "ticketing systems", "zendesk", "atendimento"],
    negative_keywords: ["desenvolvedor", "developer", "designer", "product manager", "sales representative", "vendedor", "marketing"],
    common_tools: ["zendesk", "jira service management", "anydesk", "teamviewer", "active directory"],
    industry_terms: ["sla", "ticket resolution", "n1 support", "n2 support", "escalation", "help desk"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "it support analyst",
      "pt": "analista de suporte tecnico"
    },
    career_path: ["helpdesk assistant", "support analyst", "senior technical support", "it support manager"],
    similar_roles: ["customer_success"],
    edges: {
      "customer_success": 0.5
    }
  },

  "product_manager": {
    id: "product_manager",
    department: "Product",
    aliases: [
      "product manager", "pm", "product owner", "po", "group product manager",
      "gerente de produto", "dono do produto", "head of product"
    ],
    primary_titles: ["product manager", "pm", "product owner", "po", "gerente de produto"],
    secondary_titles: ["group product manager", "dono do produto", "head of product"],
    related_titles: ["product_designer", "product_manager"],
    negative_titles: ["programador", "developer", "designer gráfico", "qa engineer", "suporte técnico"],
    required_skills: ["product strategy", "agile", "scrum", "kanban", "roadmap", "user stories", "analytics"],
    preferred_skills: ["jira", "trello", "amplitude", "mixpanel", "sql", "user research", "a/b testing", "prioritization", "product lifecycle"],
    negative_keywords: ["programador", "developer", "designer gráfico", "qa engineer", "suporte técnico", "inside sales"],
    common_tools: ["jira", "trello", "amplitude", "miro", "figma", "notion"],
    industry_terms: ["okr", "roadmap", "user story", "backlog", "mvp", "product-market fit", "discovery"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "product manager",
      "pt": "gerente de produto"
    },
    career_path: ["associate pm", "product manager", "senior product manager", "group product manager", "head of product"],
    similar_roles: ["product_designer"],
    edges: {
      "product_designer": 0.5
    }
  },

  "product_designer": {
    id: "product_designer",
    department: "Design",
    aliases: [
      "product designer", "ux designer", "ui designer", "ux/ui designer",
      "interaction designer", "designer de produto", "designer ux"
    ],
    primary_titles: ["product designer", "ux designer", "ui designer", "ux/ui designer", "designer de produto"],
    secondary_titles: ["interaction designer", "designer ux"],
    related_titles: ["product_manager", "frontend_engineer"],
    negative_titles: ["backend", "database administrator", "devops", "sales manager", "vendedor"],
    required_skills: ["figma", "wireframing", "prototyping", "user research", "ui design", "ux design", "design system"],
    preferred_skills: ["adobe xd", "sketch", "photoshop", "illustrator", "usability testing", "motion design", "html", "css", "user flows"],
    negative_keywords: ["backend", "database administrator", "devops", "sales manager", "vendedor", "cold calling"],
    common_tools: ["figma", "sketch", "adobe creative cloud", "miro", "zeplin"],
    industry_terms: ["design system", "user flow", "usability", "heuristic evaluation", "wireframe", "persona"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "product designer",
      "pt": "designer de produto"
    },
    career_path: ["junior product designer", "product designer", "senior designer", "design lead"],
    similar_roles: ["product_manager"],
    edges: {
      "product_manager": 0.5,
      "frontend_engineer": 0.4
    }
  },

  "sales_representative": {
    id: "sales_representative",
    department: "Sales",
    aliases: [
      "inside sales", "sales representative", "account executive", "ae",
      "sales development representative", "sdr", "business development representative", "bdr",
      "sales manager", "consultor de vendas", "analista comercial", "executivo de contas",
      "account manager", "account management"
    ],
    primary_titles: ["inside sales", "sales representative", "account executive", "ae", "sales development representative", "sdr", "consultor de vendas", "account manager"],
    secondary_titles: ["business development representative", "bdr", "sales manager", "analista comercial", "executivo de contas", "account management"],
    related_titles: ["customer_success", "marketing_specialist"],
    negative_titles: ["suporte técnico", "developer", "devops", "designer", "quality assurance", "programador"],
    required_skills: ["sales", "negotiation", "cold calling", "crm", "lead generation", "prospecting", "pipeline"],
    preferred_skills: ["hubspot", "salesforce", "outbound sales", "inbound sales", "b2b sales", "closing deals", "vendas"],
    negative_keywords: ["suporte técnico", "developer", "devops", "designer", "quality assurance", "programador", "backend", "frontend"],
    common_tools: ["salesforce", "hubspot", "pipedrive", "outreach", "linkedin sales navigator"],
    industry_terms: ["pipeline", "lead qualification", "b2b sales", "cold outbound", "conversion rate", "deal closing"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "sales representative",
      "pt": "consultor de vendas"
    },
    career_path: ["sdr", "account executive", "senior ae", "sales manager", "vp of sales"],
    similar_roles: ["customer_success"],
    edges: {
      "customer_success": 0.4
    }
  },

  "marketing_specialist": {
    id: "marketing_specialist",
    department: "Marketing",
    aliases: [
      "marketing specialist", "growth hacker", "social media manager", "content creator",
      "seo specialist", "performance marketing manager", "analista de marketing",
      "analista de growth", "especialista em marketing", "marketing analyst"
    ],
    primary_titles: ["marketing specialist", "growth hacker", "performance marketing manager", "analista de marketing", "especialista em marketing"],
    secondary_titles: ["social media manager", "content creator", "seo specialist", "analista de growth", "marketing analyst"],
    related_titles: ["sales_representative", "product_manager"],
    negative_titles: ["developer", "database", "it support", "csm", "help desk", "programmer"],
    required_skills: ["marketing", "seo", "sem", "social media", "copywriting", "analytics", "growth"],
    preferred_skills: ["google ads", "facebook ads", "google analytics", "hubspot", "email marketing", "content strategy", "graphic design", "branding"],
    negative_keywords: ["developer", "database", "it support", "csm", "help desk", "programmer", "backend", "frontend"],
    common_tools: ["google analytics", "google ads", "facebook ads manager", "hubspot", "semrush", "mailchimp"],
    industry_terms: ["seo", "roi", "cac", "ltv", "inbound marketing", "ctr", "cpa", "landing page"],
    seniority_aliases: {
      "junior": ["junior", "jr", "estagio", "estagiario", "intern", "trainee", "assistente"],
      "pleno": ["pleno", "pl", "mid"],
      "senior": ["senior", "sênior", "sr", "especialista"],
      "lead": ["lead", "lider", "líder", "principal", "staff"],
      "director": ["director", "diretor", "gerente", "manager", "head", "vp"]
    },
    location_aliases: {
      "remote": ["remoto", "remote", "home office", "teletrabalho", "anywhere"]
    },
    language_variants: {
      "en": "marketing specialist",
      "pt": "analista de marketing"
    },
    career_path: ["marketing assistant", "marketing analyst", "senior growth specialist", "marketing manager"],
    similar_roles: ["sales_representative"],
    edges: {
      "sales_representative": 0.3
    }
  }
};

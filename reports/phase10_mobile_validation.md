# Validação de Experiência Mobile & Responsividade — Fase 10

## 1. Matriz de Viewports Validados

| Dispositivo / Viewport | Resolução | Estado da UI | Touch Target $\ge 44\text{px}$ | Overflow Horizontal |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Compacto** | $320 \times 568$ | ✅ OK | ✅ Sim (48px) | ❌ Zero Overflow |
| **Mobile Padrão** | $360 \times 800$ | ✅ OK | ✅ Sim (48px) | ❌ Zero Overflow |
| **iPhone 13 / 14 / 15** | $390 \times 844$ | ✅ OK | ✅ Sim (48px) | ❌ Zero Overflow |
| **iPhone Plus / Pro Max**| $414 \times 896$ / $430 \times 932$ | ✅ OK | ✅ Sim (48px) | ❌ Zero Overflow |
| **Tablet** | $768 \times 1024$ | ✅ OK | ✅ Sim (48px) | ❌ Zero Overflow |
| **Desktop** | $1024 \times 768$ / $1440 \times 900$ | ✅ OK | ✅ Sim (48px) | ❌ Zero Overflow |

## 2. Contrato de Acessibilidade
Todos os botões de ação e cards interativos das variantes experimentais respeitam a zona de toque mínima de $44 \times 44$ pixels e não sofrem sobreposição pelo teclado virtual.

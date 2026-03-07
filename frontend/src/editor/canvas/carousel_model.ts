import type { Carousel } from "./types";

const carousel = {
    "meta": {
        "title": "Disciplina e Constância: reflexões práticas",
        "objective": "Engajar com reflexões curtas e acionáveis sobre disciplina e constância",
        "style": "microblog_bold",
        "palette": {
            "bg": "#0B0D12",
            "text": "#FFFFFF",
            "muted": "#9AA0A6",
            "accent": "#FDE047",
            "accent2": "#22D3EE"
        }
    },
    "slides": [
        {
            "id": "s1-hook",
            "elements": [
                {
                    "id": "s1-bg",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1080,
                    "height": 1350,
                    "fill": "#0B0D12",
                    "opacity": 1
                },
                {
                    "id": "s1-tag",
                    "type": "text",
                    "x": 72,
                    "y": 80,
                    "text": "Disciplina & constância",
                    "fill": "#22D3EE",
                    "fontSize": 28,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 936,
                    "align": "left",
                    "opacity": 0.9
                },
                {
                    "id": "s1-title",
                    "type": "text",
                    "x": 72,
                    "y": 220,
                    "text": "Motivação falha.\nSistema fica.",
                    "fill": "#FFFFFF",
                    "fontSize": 96,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s1-underline",
                    "type": "path",
                    "x": 72,
                    "y": 430,
                    "data": "M0 0 H460 V14 H0 Z",
                    "fill": "#FDE047",
                    "opacity": 1
                },
                {
                    "id": "s1-sub",
                    "type": "text",
                    "x": 72,
                    "y": 520,
                    "text": "6 reflexões curtas para construir constância",
                    "fill": "#9AA0A6",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                }
            ]
        },
        {
            "id": "s2-minimo-viavel",
            "elements": [
                {
                    "id": "s2-bg",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1080,
                    "height": 1350,
                    "fill": "#0B0D12",
                    "opacity": 1
                },
                {
                    "id": "s2-bar",
                    "type": "path",
                    "x": 60,
                    "y": 140,
                    "data": "M0 0 H8 V370 H0 Z",
                    "fill": "#22D3EE",
                    "opacity": 1
                },
                {
                    "id": "s2-title",
                    "type": "text",
                    "x": 92,
                    "y": 120,
                    "text": "1) Comece pelo mínimo viável",
                    "fill": "#FFFFFF",
                    "fontSize": 64,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 920,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s2-points",
                    "type": "text",
                    "x": 92,
                    "y": 230,
                    "text": "• Tarefas que cabem em dias ruins.\n• Ex.: 10 min de leitura > 1h no domingo.",
                    "fill": "#FFFFFF",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 920,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s2-note",
                    "type": "text",
                    "x": 92,
                    "y": 380,
                    "text": "Nota pessoal: deslanchou quando aceitei fazer “pouco, mas hoje”.",
                    "fill": "#9AA0A6",
                    "fontSize": 30,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 920,
                    "align": "left",
                    "opacity": 1
                }
            ]
        },
        {
            "id": "s3-ambiente",
            "elements": [
                {
                    "id": "s3-bg",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1080,
                    "height": 1350,
                    "fill": "#0B0D12",
                    "opacity": 1
                },
                {
                    "id": "s3-title",
                    "type": "text",
                    "x": 72,
                    "y": 120,
                    "text": "2) Ambiente vence vontade",
                    "fill": "#FFFFFF",
                    "fontSize": 64,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s3-points",
                    "type": "text",
                    "x": 72,
                    "y": 230,
                    "text": "• Remova atrito e deixe o próximo passo óbvio.\n• Ex.: garrafa cheia, tênis à vista, app já aberto.",
                    "fill": "#FFFFFF",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s3-underline",
                    "type": "path",
                    "x": 72,
                    "y": 200,
                    "data": "M0 0 H520 V10 H0 Z",
                    "fill": "#FDE047",
                    "opacity": 1
                }
            ]
        },
        {
            "id": "s4-gatilho",
            "elements": [
                {
                    "id": "s4-bg",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1080,
                    "height": 1350,
                    "fill": "#0B0D12",
                    "opacity": 1
                },
                {
                    "id": "s4-title",
                    "type": "text",
                    "x": 72,
                    "y": 120,
                    "text": "3) Crie um gatilho fixo",
                    "fill": "#FFFFFF",
                    "fontSize": 64,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s4-points",
                    "type": "text",
                    "x": 72,
                    "y": 230,
                    "text": "• Mesmo horário + primeira ação idêntica.\n• Ex.: café → abrir editor por 5 min.",
                    "fill": "#FFFFFF",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s4-marker",
                    "type": "path",
                    "x": 72,
                    "y": 340,
                    "data": "M0 0 H300 V8 H0 Z",
                    "fill": "#22D3EE",
                    "opacity": 1
                }
            ]
        },
        {
            "id": "s5-metricas",
            "elements": [
                {
                    "id": "s5-bg",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1080,
                    "height": 1350,
                    "fill": "#0B0D12",
                    "opacity": 1
                },
                {
                    "id": "s5-title",
                    "type": "text",
                    "x": 72,
                    "y": 120,
                    "text": "4) Meça o que controla",
                    "fill": "#FFFFFF",
                    "fontSize": 64,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 760,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s5-points",
                    "type": "text",
                    "x": 72,
                    "y": 230,
                    "text": "• Conte minutos e dias seguidos, não resultados.\n• Marque um X no calendário.\nPergunta: qual métrica simples você vai usar?",
                    "fill": "#FFFFFF",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s5-image-calendar",
                    "type": "image",
                    "x": 820,
                    "y": 110,
                    "width": 180,
                    "height": 180,
                    "prompt": "Minimal flat icon of a calendar with bold high-contrast style on dark background, using yellow and cyan accents, clean vector, no text, educational feel",
                    "borderRadius": 24,
                    "opacity": 1
                }
            ]
        },
        {
            "id": "s6-cta",
            "elements": [
                {
                    "id": "s6-bg",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1080,
                    "height": 1350,
                    "fill": "#0B0D12",
                    "opacity": 1
                },
                {
                    "id": "s6-title",
                    "type": "text",
                    "x": 72,
                    "y": 120,
                    "text": "Agora, 7 dias de teste",
                    "fill": "#FFFFFF",
                    "fontSize": 72,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s6-steps",
                    "type": "text",
                    "x": 72,
                    "y": 230,
                    "text": "• Escolha 1 micro-hábito.\n• Defina gatilho e prepare o ambiente.\n• Faça hoje (2–10 min).",
                    "fill": "#FFFFFF",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s6-cta-bg",
                    "type": "path",
                    "x": 72,
                    "y": 420,
                    "data": "M0 0 H936 V120 H0 Z",
                    "fill": "#FDE047",
                    "opacity": 1
                },
                {
                    "id": "s6-cta-text",
                    "type": "text",
                    "x": 96,
                    "y": 458,
                    "text": "Comente “7DIAS” e envio um checklist.",
                    "fill": "#0B0D12",
                    "fontSize": 44,
                    "fontFamily": "Inter",
                    "fontStyle": "bold",
                    "width": 888,
                    "align": "left",
                    "opacity": 1
                },
                {
                    "id": "s6-footer",
                    "type": "text",
                    "x": 72,
                    "y": 570,
                    "text": "Salve para lembrar amanhã. Topa?",
                    "fill": "#22D3EE",
                    "fontSize": 40,
                    "fontFamily": "Inter",
                    "fontStyle": "regular",
                    "width": 936,
                    "align": "left",
                    "opacity": 1
                }
            ]
        }
    ]
};

export default carousel;
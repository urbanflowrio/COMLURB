/* Resumo corporativo pré-agregado; nenhuma linha individual ou URL de pessoal. */
window.PESSOAS_PUBLICO = {
  "meta": {
    "origem": "SARC · aba geral · consolidado COMLURB",
    "extracao": "21/10/2026",
    "modo": "fotografia homologação · sem dados pessoais"
  },
  "months": [
    "Set/25",
    "Out/25",
    "Nov/25",
    "Dez/25",
    "Jan/26",
    "Fev/26",
    "Mar/26",
    "Abr/26",
    "Mai/26",
    "Jun/26",
    "Jul/26",
    "Ago/26",
    "Set/26"
  ],
  "indicadores": [
    {
      "id": "abs",
      "name": "Absenteísmo",
      "type": "taxa",
      "unit": "%",
      "data": [
        3.4,
        4.5,
        4.0,
        4.1,
        6.0,
        4.8,
        4.5,
        4.3,
        4.5,
        5.4,
        6.1,
        5.2,
        5.0
      ],
      "period": "Set/26",
      "desc": "Taxa oficial de absenteísmo consolidada da COMLURB, conforme fonte SARC; menor é melhor."
    },
    {
      "id": "absg",
      "name": "Absenteísmo gerenciável",
      "type": "taxa",
      "unit": "%",
      "data": [
        null,
        null,
        null,
        null,
        2.3,
        2.7,
        2.7,
        2.2,
        2.4,
        2.7,
        2.8,
        3.2,
        3.0
      ],
      "period": "Set/26",
      "desc": "Taxa oficial de absenteísmo gerenciável; não corresponde ao número de laudos."
    },
    {
      "id": "typ",
      "name": "Acidentes típicos",
      "type": "fluxo",
      "unit": "ocorrências",
      "data": [
        null,
        null,
        null,
        null,
        21,
        25,
        50,
        30,
        35,
        34,
        33,
        39,
        39
      ],
      "period": "Set/26",
      "desc": "Ocorrências mensais da SARC, não equivalem a acidentes registrados em bases de investigação."
    },
    {
      "id": "traj",
      "name": "Acidentes de trajeto",
      "type": "fluxo",
      "unit": "ocorrências",
      "data": [
        null,
        null,
        null,
        null,
        9,
        6,
        13,
        8,
        8,
        8,
        9,
        8,
        12
      ],
      "period": "Set/26",
      "desc": "Ocorrências mensais do consolidado COMLURB na fonte oficial SARC."
    },
    {
      "id": "afast",
      "name": "Empregados afastados",
      "type": "estoque",
      "unit": "empregados",
      "data": [
        null,
        null,
        null,
        null,
        1679,
        1679,
        1730,
        1761,
        1722,
        1701,
        1655,
        1653,
        null
      ],
      "period": "Ago/26",
      "desc": "Quantidade de afastados no mês. Série institucional disponível até agosto; não extrapolar setembro nem confundir com laudos vigentes."
    },
    {
      "id": "freq",
      "name": "Taxa de frequência de acidentes",
      "type": "taxa",
      "unit": "índice oficial",
      "data": [
        null,
        null,
        null,
        null,
        9.1,
        13.8,
        10.5,
        10.5,
        7.1,
        11.5,
        11,
        5.2,
        null
      ],
      "period": "Ago/26",
      "desc": "Índice oficial da SARC. Preservada a unidade declarada na origem, sem recalcular por ocorrência."
    }
  ]
};

const menuData = {
    "categories": [
        {
            "id": "pizzas",
            "name": "Pizzas"
        },
        {
            "id": "bebidas",
            "name": "Bebidas"
        },
        {
            "id": "c1765145974575",
            "name": "Sobremesa"
        }
    ],
    "products": {
        "pizzas": [
            {
                "id": 1,
                "name": "4 Estações I",
                "description": "2 ped. Mussarela, 2 ped. Calabresa, 2 ped. Frango e 2 ped. Carne de Sol.",
                "price": 27,
                "image": "https://img.freepik.com/fotos-gratis/pizza-de-quatro-queijos-com-manjericao_140725-5259.jpg",
                "isPopular": false
            },
            {
                "id": 2,
                "name": "4 Estações II",
                "description": "2 ped. Calabresa, 2 ped. Mista, 2 ped. Frango e 2 ped. Portuguesa.",
                "price": 28,
                "image": "https://img.freepik.com/fotos-gratis/saborosa-pizza-de-pepperoni-e-cogumelos-com-manjericao-e-tomate-em-cimo-da-mesa_140725-6518.jpg",
                "isPopular": false
            },
            {
                "id": 3,
                "name": "Pequena",
                "description": "Pizza com 1 sabor e 4 fatias.",
                "price": 24,
                "image": "https://img.freepik.com/fotos-gratis/pizza-mista-com-azeitonas_140725-1154.jpg",
                "isPopular": false
            },
            {
                "id": 4,
                "name": "Média",
                "description": "Pizza com até 2 sabores e 6 fatias.",
                "price": 27,
                "image": "https://img.freepik.com/fotos-gratis/pizza-fresca_144627-25458.jpg",
                "isPopular": false
            },
            {
                "id": 5,
                "name": "Grande",
                "description": "Pizza com até 2 sabores e 8 fatias. A partir de R$ 32,00",
                "price": 32,
                "image": "https://img.freepik.com/fotos-gratis/pizza-isolada-no-fundo-branco_140725-263.jpg",
                "isPopular": true
            }
        ],
        "bebidas": [
            {
                "id": 7,
                "name": "Refrigerante Lata",
                "description": "350ml",
                "price": 1,
                "image": "https://img.freepik.com/vetores-gratis/refrigerantes-realistas-em-latas-de-aluminio_23-2148141446.jpg",
                "isPopular": false
            }
        ],
        "c1765145974575": [
            {
                "id": "prod_1765145984423",
                "name": "Pudim",
                "description": "Melhor Pudim da cidade",
                "price": 2,
                "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpXGhTY0S0ykz1zct0t4bsmG8tHUyMk3o9feo42myZXGXaW99vyeZAJkzcxdHnCYLukW7n9ygjMDzGcMFgCnADOx0SH45CDctGEYVEDMiMIQ&s=10",
                "isPopular": true
            }
        ]
    },
    "neighborhoods": [
        {
            "name": "Centro",
            "fee": 2
        },
        {
            "name": "Bairro de Fátima",
            "fee": 7
        },
        {
            "name": "Aldeota",
            "fee": 8
        },
        {
            "name": "Meireles",
            "fee": 9
        },
        {
            "name": "Dionísio Torres",
            "fee": 9
        },
        {
            "name": "Joaquim Távora",
            "fee": 12
        },
        {
            "name": "Benfica",
            "fee": 5
        },
        {
            "name": "Aerolândia",
            "fee": 10
        }
    ],
    "openingHours": {
        "0": {
            "open": "21:36",
            "close": "23:00",
            "active": true
        },
        "1": {
            "open": "18:00",
            "close": "23:00",
            "active": true
        },
        "2": {
            "open": "18:00",
            "close": "23:00",
            "active": true
        },
        "3": {
            "open": "18:00",
            "close": "23:00",
            "active": true
        },
        "4": {
            "open": "18:00",
            "close": "23:00",
            "active": true
        },
        "5": {
            "open": "18:00",
            "close": "23:00",
            "active": true
        },
        "6": {
            "open": "18:00",
            "close": "23:00",
            "active": true
        }
    }
};

if (typeof module !== 'undefined') module.exports = menuData;
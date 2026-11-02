"use client";

import { useState } from "react";
import Link from "next/link";

interface PlanItem {
  day: number;
  weekday: string;
  nicheTrend: string;
  nicheInsight: string;
  // Feed Post
  post: {
    format: "Post" | "Reel" | "Carrusel";
    headline: string;
    productName: string;
    price: string;
    isPromo: boolean;
    hasText: boolean;
    artDirection: {
      layout: string;
      layoutLabel: string;
      fontStyle: string;
      fontLabel: string;
      reasoning: string;
    };
    hook: string;
    copy: string;
    cta: string;
    imageUrl: string;
    compositionDirective: string;
  };
  // Daily Story
  story: {
    time: string;
    objective: string;
    hook: string;
    interactiveType: "Encuesta" | "Deslizador" | "Caja de Preguntas" | "Cuenta Regresiva" | "Link WhatsApp" | "Votación 2x1";
    interactiveLabel: string;
    slideTexts: string[];
    visualRecommendation: string;
  };
}

const MANIA_14_DAYS_PLAN: PlanItem[] = [
  {
    day: 1,
    weekday: "Lunes",
    nicheTrend: "Solución anticrisis para empezar la semana sin cocinar",
    nicheInsight: "En gastronomía nocturna los lunes son flojos salvo que lances una promo de volumen irresistible para compartir en casa o salón.",
    post: {
      format: "Post",
      headline: "4 Hand Rolls x $10.000",
      productName: "Hand Rolls Apanados en Panko",
      price: "$10.000 (4 unidades)",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "split_left",
        layoutLabel: "◧ Split Lateral Izquierdo",
        fontStyle: "bold_modern",
        fontLabel: "🔥 Bold Impacto",
        reasoning: "Rolls cortados en diagonal a la derecha mostrando el queso y la palta; nuestros agentes dejaron la columna izquierda limpia para el precio de alto impacto y llamado a pedir."
      },
      hook: "El lunes no se cocina en Manía. 4 Hand Rolls apanados por $10.000.",
      copy: "Saliste cansado de la pega o la u y lo último que quieres es ponerte a lavar platos. Pásate por Manía o pídelos para llevar: 4 hand rolls gigantes, recién salidos del panko dorado y crujiente, bien cargados de pollo tierno, queso crema fundido y palta hass en su punto. Con salsa teriyaki dulce para untar sin culpa.",
      cta: "Pídelos directo por nuestro WhatsApp o ven a buscarlos a la barra.",
      imageUrl: "/demo-mania/hand_rolls.jpg",
      compositionDirective: "Encuadre asimétrico 4:5. Hand rolls en el tercio derecho con iluminación lateral cálida que resalta el crujiente del panko. 50% izquierdo con bokeh suave de la barra."
    },
    story: {
      time: "13:00 hrs (Antojo de almuerzo/cena)",
      objective: "Interacción directa y activación de pedidos tempranos",
      hook: "¿Lunes de cocinar o lunes de Manía?",
      interactiveType: "Encuesta",
      interactiveLabel: "Encuesta: 'Pido los 4 Rolls' vs 'Cocino arroz'",
      slideTexts: [
        "Lunes 13:00 hrs y tu estómago ya sabe lo que quiere...",
        "Crujientes por fuera, cremosos por dentro. 4 Hand Rolls x $10.000 toda la tarde.",
        "Toca aquí abajo y te los tenemos listos cuando pases 👇"
      ],
      visualRecommendation: "Foto vertical 9:16 en primer plano del queso crema estirándose al partir el roll por la mitad. Sticker de encuesta en el tercio inferior."
    }
  },
  {
    day: 2,
    weekday: "Martes",
    nicheTrend: "Martes de bajón cervecero y tablas para picar",
    nicheInsight: "El público joven busca excusas para cortar la semana temprano con comida abundante que se pueda compartir entre varios.",
    post: {
      format: "Post",
      headline: "Tabla Manía Mar y Tierra",
      productName: "Tabla Mixta con Camarones y Mechada",
      price: "$15.990 (Comen 3)",
      isPromo: false,
      hasText: false,
      artDirection: {
        layout: "clean_photo",
        layoutLabel: "📸 Fotografía Limpia (Sin Cartel)",
        fontStyle: "clean_minimal",
        fontLabel: "Sin texto en imagen",
        reasoning: "La abundancia de los camarones al ajillo y la mechada humeante tiene tanta fuerza visual que cualquier cartel taparía la comida. Nuestros agentes eligieron imagen limpia y precio en el copy."
      },
      hook: "Cuando una sola cosa no alcanza para calmar el hambre, se pide esto.",
      copy: "Papas rústicas doradas en la base, porción generosa de carne mechada jugosa deshilachada a mano, camarones al ajillo con un toque de merkén ahumado y nuestras tres salsas de la casa. Si vienes de a dos o tres amigos, con esta tabla y un par de schops la noche queda resuelta al tiro.",
      cta: "Etiqueta a los dos amigos que te deben una salida este martes.",
      imageUrl: "/demo-mania/feed_referencia.jpg",
      compositionDirective: "Plano cenital 45 grados sobre tabla de madera noble. Iluminación ámbar de restobar con reflejos en las salsas y vapor sutil."
    },
    story: {
      time: "19:30 hrs (After office)",
      objective: "Antojo visual en video corto para atraer mesas presenciales",
      hook: "El sonido de la plancha a esta hora no tiene comparación.",
      interactiveType: "Deslizador",
      interactiveLabel: "Deslizador de fueguito 🔥",
      slideTexts: [
        "19:30 hrs en Manía Restobar...",
        "Camarones saltando en la sartén + schop helado esperando en la mesa.",
        "¿Te sumas hoy? Barra abierta hasta las 02:00."
      ],
      visualRecommendation: "Video 9:16 de 5 segundos con el audio ambiente del bar, sonido del sartén y choque de dos copas de cerveza."
    }
  },
  {
    day: 3,
    weekday: "Miércoles",
    nicheTrend: "Miércoles de cócteles 2x1 y corte de semana con amigas",
    nicheInsight: "El radar detectó que los miércoles tienen alta demanda de coctelería frutal y tragos dulces con promociones claras antes de las 22:00.",
    post: {
      format: "Post",
      headline: "Miércoles 2x1 en Mojitos de Sabores",
      productName: "Mojitos Maracuyá, Frambuesa y Clásico",
      price: "2x1 hasta las 22:00 hrs",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "top_banner",
        layoutLabel: "⬆️ Cabecera Superior",
        fontStyle: "serif_script_mix",
        fontLabel: "📰 Mix Editorial Serif",
        reasoning: "Copas altas de mojito con hielo frappé en el centro; nuestros agentes situaron el 2x1 en la cabecera superior dorada para mantener las copas y la menta fresca despejadas."
      },
      hook: "La semana se hace la mitad de larga cuando hay 2x1 en la mesa.",
      copy: "Menta fresca machacada al momento, ron añejo, hielo frappe bien compacto y pulpa natural de maracuyá o frambuesa recién preparada. Hoy miércoles pide uno y el segundo va por cuenta de la casa hasta las 22:00 hrs. Puedes mezclar sabores o repetir tu regalón.",
      cta: "Mesas por orden de llegada o reserva tu rincón por mensaje directo.",
      imageUrl: "/demo-mania/feed_promo_ref.jpg",
      compositionDirective: "Dos vasos altos con condensación helada, rodajas de lima y hojas de menta brillante. Fondo oscuro con luces cálidas de neón."
    },
    story: {
      time: "17:00 hrs",
      objective: "Decisión rápida de grupo antes de salir del trabajo",
      hook: "¿Maracuyá o Frambuesa? Tú eliges la primera ronda.",
      interactiveType: "Votación 2x1",
      interactiveLabel: "Votación: '🥭 Maracuyá' vs '🍓 Frambuesa'",
      slideTexts: [
        "Hoy el Happy Hour se adelantó en Manía.",
        "Mojitos 2x1 de 18:00 a 22:00 hrs. ¿Con cuál abrimos la cuenta?",
        "Toca tu favorito y muéstraselo al garzón cuando llegues 😉"
      ],
      visualRecommendation: "Primer plano vertical de la jarra sirviendo el mojito con burbujas y menta fresca. Sticker de votación bien visible."
    }
  },
  {
    day: 4,
    weekday: "Jueves",
    nicheTrend: "El nuevo viernes: promos de sándwiches gigantes para el grupo",
    nicheInsight: "En Chile el jueves se consolidó como día de previa y comida contundente. El churrasco y la mechada lideran las búsquedas de delivery y consumo local.",
    post: {
      format: "Post",
      headline: "3 Churrascos x $10.000",
      productName: "Trío Manía: Italiano, Luco y Chacarero",
      price: "$10.000 (3 sándwiches)",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "split_right",
        layoutLabel: "◨ Split Lateral Derecho",
        fontStyle: "bold_modern",
        fontLabel: "🔥 Bold Impacto",
        reasoning: "Los tres churrascos están montados en diagonal a la izquierda; nuestros agentes colocaron la columna de la promo en el tercio derecho para equilibrar la composición."
      },
      hook: "Un Italiano, un Luco y un Chacarero por $10.000. Así de simple.",
      copy: "Carne de vacuno a la plancha caliente, pan frica redondo bien tostado con mantequilla y tres clásicos que no fallan nunca: palta hass molida con tomate fresco y mayo casera, queso mantecoso derretido elástico por los costados, y porotos verdes tiernos con ají verde al hilo. Alcanza para tres o para dos con hambre seria.",
      cta: "Válido hoy en local y para retiro. Escríbenos al WhatsApp antes de que se agote el pan fresco.",
      imageUrl: "/demo-mania/churrascos.jpg",
      compositionDirective: "Tres churrascos artesanales alineados sobre tabla de roble. Queso fundido cayendo y palta fresca brillante. Luz lateral directa."
    },
    story: {
      time: "20:00 hrs",
      objective: "Fomentar que etiqueten amigos para armar el grupo",
      hook: "3 churrascos en la mesa. ¿Quién se come el Luco?",
      interactiveType: "Caja de Preguntas",
      interactiveLabel: "Caja: 'Etiqueta al amigo que no comparte las papas'",
      slideTexts: [
        "La promo favorita de la casa ya está saliendo en cocina.",
        "3 sándwiches completos por 10 lucas. No hay excusa hoy.",
        "Estamos en Manía esperándote con la plancha al rojo vivo."
      ],
      visualRecommendation: "Foto en ángulo cerrado al corte del churrasco italiano con humo saliendo de la carne caliente."
    }
  },
  {
    day: 5,
    weekday: "Viernes",
    nicheTrend: "Viernes de Chorrillana XXL y bienvenida al fin de semana",
    nicheInsight: "El viernes manda la comida comunal que se pone al centro de la mesa con cerveza bien fría mientras suena música en vivo o ambiente de fiesta.",
    post: {
      format: "Post",
      headline: "Chorrillana Manía Monumental",
      productName: "Chorrillana Tradicional con Posta y Cebolla Caramelizada",
      price: "Pican 4 personas",
      isPromo: false,
      hasText: false,
      artDirection: {
        layout: "clean_photo",
        layoutLabel: "📸 Fotografía Limpia (Sin Cartel)",
        fontStyle: "clean_minimal",
        fontLabel: "Sin texto en imagen",
        reasoning: "El huevo frito reventándose sobre las papas calientes es el mejor vendedor. Nuestros agentes priorizan la foto limpia 100% apetitosa para captar la mirada en el feed."
      },
      hook: "Se terminó la semana. Esto es exactamente lo que te mereces.",
      copy: "Kilo y medio de sabor puesto al centro de la mesa: papas fritas rústicas crujientes por fuera y suaves por dentro, carne picada a mano bien sazonada, cebolla caramelizada lenta en su jugo y dos huevos fritos con la yema lista para romper. Pídela con dos schops helados y ya tienes la noche armada.",
      cta: "Caigan temprano porque los viernes la casa se llena rápido. ¡Nos vemos en Manía!",
      imageUrl: "/demo-mania/churrascos.jpg",
      compositionDirective: "Primer plano cenital inclinado de chorrillana humeante con schops de cerveza de fondo desenfocados."
    },
    story: {
      time: "18:00 hrs (Punto clave del viernes)",
      objective: "Generar urgencia con cuenta regresiva y botón de reserva",
      hook: "El primer schop del fin de semana sabe distinto.",
      interactiveType: "Cuenta Regresiva",
      interactiveLabel: "Cuenta regresiva: 'Apertura de barra viernes 🍻'",
      slideTexts: [
        "Viernes 18:00 hrs. El modo descanso se activa ahora.",
        "Música lista, schop saliendo a -2 grados y la cocina a full.",
        "Quedan pocas mesas libres para el primer turno. Reserva al DM 📲"
      ],
      visualRecommendation: "Video dinámico del schop llenándose con la espuma cremosa desbordando. Sticker de cuenta regresiva centrado."
    }
  },
  {
    day: 6,
    weekday: "Sábado",
    nicheTrend: "Noche de fiesta, coctelería de autor y previa con amigos",
    nicheInsight: "Los sábados en la noche el ticket promedio sube si destacas tragos especiales, piscolas de 1 litro o promociones de baldes de cerveza.",
    post: {
      format: "Post",
      headline: "Noche de Coctelería & Fiesta Manía",
      productName: "Tragos de Autor & Piscola Tradicional",
      price: "2x $9.990 en cócteles seleccionados",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "top_banner",
        layoutLabel: "⬆️ Cabecera Superior",
        fontStyle: "elegant_serif",
        fontLabel: "✨ Serif Elegante",
        reasoning: "Ambiente nocturno con iluminación azul y copas con hielo; nuestros agentes eligieron Cabecera Superior con tipografía elegante para proyectar el ambiente de fiesta del bar."
      },
      hook: "El sábado no se improvisa: se pasa en Manía con buena música y la copa llena.",
      copy: "Desde la piscola negra bien fría con hielo de roca hasta nuestros tragos de autor con gin, frutos rojos y tónica premium. Si buscas un lugar donde comer rico primero y quedarse compartiendo hasta tarde después, esta noche la barra es tuya.",
      cta: "Ven con tu grupo o manda un mensaje al DM para asegurar tu mesa en el salón.",
      imageUrl: "/demo-mania/feed_promo_ref.jpg",
      compositionDirective: "Copas iluminadas con luces de neón moradas y azules de restobar nocturno. Hielo cristalino y detalles de garnish."
    },
    story: {
      time: "21:30 hrs",
      objective: "Mostrar el ambiente real en vivo para provocar FOMO",
      hook: "Así se ve la noche de sábado en Manía Restobar.",
      interactiveType: "Deslizador",
      interactiveLabel: "Deslizador de fiesta 🚀",
      slideTexts: [
        "Salón lleno, las mejores promos activas y el ambiente prendido.",
        "Si todavía estás pensando dónde ir, acá te tenemos un espacio esperándote.",
        "Desliza el fuego si hoy se sale 👇"
      ],
      visualRecommendation: "Panorámica corta de 4 segundos del salón con luz tenue cálida, risas y copas en alto. Música de fondo en tendencia."
    }
  },
  {
    day: 7,
    weekday: "Domingo",
    nicheTrend: "Domingo de bajón familiar y delivery a la puerta",
    nicheInsight: "Los domingos por la tarde noche la gente no quiere salir de casa pero busca comida reconfortante que llegue rápido y caliente.",
    post: {
      format: "Post",
      headline: "Promo Bajón: Burger Doble + Papas",
      productName: "Hamburguesa Manía Doble Carne con Queso Cheddar",
      price: "$6.990 con papas fritas",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "recipe_ingredients",
        layoutLabel: "📋 Ficha Editorial / Atributos",
        fontStyle: "bold_modern",
        fontLabel: "🔥 Bold Impacto",
        reasoning: "Hamburguesa imponente al centro con tira inferior de atributos (doble carne smash, cheddar fundido, cebolla crispy y papas rústicas) que explican el valor sin saturar la foto."
      },
      hook: "Para cerrar el fin de semana como corresponde: doble carne y queso fundido.",
      copy: "Dos medallones de carne molida fresca aplastados en plancha bien caliente para formar esa costra crujiente perfecta, doble lámina de queso cheddar derretido encima, salsa secreta de la casa y porción de papas fritas recién hechas. Perfecta para ver una serie o compartir en el sillón.",
      cta: "Pídela por WhatsApp para retiro o delivery directo a tu casa.",
      imageUrl: "/demo-mania/churrascos.jpg",
      compositionDirective: "Primer plano de la hamburguesa con el queso cayendo en cascada. Iluminación frontal suave sobre mesa rústica."
    },
    story: {
      time: "19:00 hrs",
      objective: "Canalizar pedidos a domicilio de forma directa",
      hook: "¿Prefieres salir o que te toque el timbre el delivery?",
      interactiveType: "Link WhatsApp",
      interactiveLabel: "Botón: 'Pedir por WhatsApp ahora 🛵'",
      slideTexts: [
        "Domingo por la tarde = permiso para comer rico sin moverte del sillón.",
        "Burger doble carne + papas por $6.990 hasta agotar stock.",
        "Toca el link y te la mandamos caliente a tu puerta 👇"
      ],
      visualRecommendation: "Primer plano de la burger abriéndose al medio mostrando el vapor y los ingredientes frescos. Sticker con enlace directo a WhatsApp."
    }
  },
  {
    day: 8,
    weekday: "Lunes",
    nicheTrend: "Sushi lovers & desintoxicación del fin de semana con rolls frescos",
    nicheInsight: "Tras los excesos del fin de semana, el consumidor busca comida sabrosa pero percibida como más fresca o ligera, donde el sushi artesanal brilla.",
    post: {
      format: "Post",
      headline: "Roll Acevichado Especial de la Casa",
      productName: "Sushi Roll Acevichado con Camarón Furai",
      price: "$7.500 (10 piezas)",
      isPromo: false,
      hasText: false,
      artDirection: {
        layout: "clean_photo",
        layoutLabel: "📸 Fotografía Limpia (Sin Cartel)",
        fontStyle: "clean_minimal",
        fontLabel: "Sin texto en imagen",
        reasoning: "La frescura de la salsa acevichada sobre las láminas de palta y el sésamo tostado luce mejor como fotografía de autor limpia, invitando al antojo natural."
      },
      hook: "El sushi bien hecho no necesita adornos: se nota desde el primer bocado.",
      copy: "Camarón furai crocante y palta hass por dentro, envuelto en pesca fresca del día y bañado en nuestra salsa acevichada cremosa con cilantro fino y gotas de limón de pica. Preparado pieza por pieza en nuestra barra con ingredientes frescos de la mañana.",
      cta: "Disponible desde las 17:00 hrs para consumo en local y delivery.",
      imageUrl: "/demo-mania/hand_rolls.jpg",
      compositionDirective: "Roll presentado sobre piedra pizarra oscura. Salsa acevichada brillante con cebollín picado fino y semillas de sésamo."
    },
    story: {
      time: "12:45 hrs",
      objective: "Mostrar preparación artesanal para generar confianza",
      hook: "Así se arman los rolls de hoy en nuestra barra.",
      interactiveType: "Deslizador",
      interactiveLabel: "Deslizador de antojo 🍣",
      slideTexts: [
        "Paso a paso en cocina: panko crujiente + palta recién cortada.",
        "Nada de rolls precocinados; todo sale fresco en el minuto.",
        "¿Se te antojó para hoy? Abrimos a las 17:00 hrs."
      ],
      visualRecommendation: "Clip vertical de 6 segundos de las manos del sushiman cortando las piezas con cuchillo japonés afilado."
    }
  },
  {
    day: 9,
    weekday: "Martes",
    nicheTrend: "Papas rústicas cargadas: el snack preferido para acompañar tragos",
    nicheInsight: "Las porciones de papas fritas gourmet con toppings son el producto con mayor margen y viralidad en historias de Instagram.",
    post: {
      format: "Post",
      headline: "Papas Rústicas Cargadas Manía",
      productName: "Papas Fritas con Queso Cheddar, Tocino y Ciboulette",
      price: "$8.990 (Comen 2 o 3)",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "top_banner",
        layoutLabel: "⬆️ Cabecera Superior",
        fontStyle: "bold_modern",
        fontLabel: "🔥 Bold Impacto",
        reasoning: "Bandeja llena de papas humeantes al centro; nuestros agentes ubicaron la cabecera arriba con franja contrastante para destacar el precio de la porción."
      },
      hook: "Nadie viene a Manía a comerse solo una papa. Es imposible.",
      copy: "Papas rústicas con cáscara fritas al punto exacto, bañadas en abundante salsa de queso cheddar artesanal derretida y cubiertas con crocantes trozos de tocino ahumado salteado al wok y ciboulette fresco. Pídelas al centro con un schop helado y conversa tranquilo.",
      cta: "¿Con quién compartirías este plato hoy? Etiquétalo aquí.",
      imageUrl: "/demo-mania/churrascos.jpg",
      compositionDirective: "Vista picada de 30 grados de una fuente rústica de papas con queso elástico desbordando por los bordes."
    },
    story: {
      time: "19:00 hrs",
      objective: "Juego de interacción para calentar la cuenta",
      hook: "Pregunta seria: ¿De qué salsa eres fanático?",
      interactiveType: "Encuesta",
      interactiveLabel: "Encuesta: 'Cheddar & Tocino' vs 'Salsa de Ajo Casera'",
      slideTexts: [
        "Martes de debate gastronómico en Manía...",
        "¿Prefieres tus papas bañadas en cheddar y tocino o con salsa de ajo suave?",
        "Vota aquí abajo y los leemos 👇"
      ],
      visualRecommendation: "Primer plano de una papa sacando una hebra larga de queso derretido con sticker interactivo."
    }
  },
  {
    day: 10,
    weekday: "Miércoles",
    nicheTrend: "Historia del chef y secretos de cocina (humanización de marca)",
    nicheInsight: "Un feed que solo publica ofertas aburre. Intercalar el secreto de una preparación emblemática genera confianza y posiciona al negocio como referente de calidad.",
    post: {
      format: "Post",
      headline: "El Secreto de Nuestra Mechada",
      productName: "Carne Mechada con 6 Horas de Cocción Lenta",
      price: "Especialidad Tradicional",
      isPromo: false,
      hasText: false,
      artDirection: {
        layout: "clean_photo",
        layoutLabel: "📸 Fotografía Limpia (Sin Cartel)",
        fontStyle: "clean_minimal",
        fontLabel: "Sin texto en imagen",
        reasoning: "Post de autoridad culinaria: la fotografía limpia de la carne desmenuzándose sola con los jugos de cocción transmite honestidad y artesanía gastronómica."
      },
      hook: "Seis horas a fuego lento. No hay atajos para lograr este sabor.",
      copy: "Cada mañana sazonamos los cortes de carne con cebolla dorada, pimentón asado, vino tinto chileno y hierbas de huerto. Se cocina tapada a fuego bajísimo durante seis horas hasta que prácticamente se desarma al tocarla con el tenedor. Por eso cuando la pruebas en tu sándwich o chorrillana, el sabor es profundo y jugoso.",
      cta: "Ven a probarla hoy miércoles en tu formato favorito: sándwich, chorrillana o tabla.",
      imageUrl: "/demo-mania/feed_referencia.jpg",
      compositionDirective: "Primer plano de la olla de hierro con la carne mechada humeante deshilachándose con pinzas de cocina."
    },
    story: {
      time: "11:30 hrs",
      objective: "Antojo temprano mostrando la cocina en movimiento",
      hook: "El olor que sale de la cocina a esta hora...",
      interactiveType: "Deslizador",
      interactiveLabel: "Deslizador de sabor 🤤",
      slideTexts: [
        "11:30 de la mañana en Manía.",
        "La mechada lleva 4 horas en la olla y ya está casi lista para la tarde.",
        "Si vienes hoy, pide que te la sirvan con queso mantecoso extra."
      ],
      visualRecommendation: "Video corto vertical de la olla destapándose con el humo aromático saliendo despacio."
    }
  },
  {
    day: 11,
    weekday: "Jueves",
    nicheTrend: "Jueves cervecero: schops a precio especial para previar",
    nicheInsight: "Las promociones de schop artesanal a precio gancho atraen grupos que luego consumen comida de alto margen como hamburguesas y hand rolls.",
    post: {
      format: "Post",
      headline: "Jueves Cervecero: Schop 500cc a $2.500",
      productName: "Schop Artesanal Rubia y Negra",
      price: "$2.500 toda la noche",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "split_left",
        layoutLabel: "◧ Split Lateral Izquierdo",
        fontStyle: "bold_modern",
        fontLabel: "🔥 Bold Impacto",
        reasoning: "Schop helado con gotas de condensación en el tercio derecho; nuestros agentes ubicaron la oferta de $2.500 a la izquierda en tamaño grande para captar al scrollear."
      },
      hook: "Jueves con sabor a fin de semana: Schop artesanal de 500cc a $2.500.",
      copy: "Temperatura perfecta, espuma cremosa que retiene el aroma y las mejores variedades locales de cerveza tirada directamente de la chopera. Pide la tuya acompañada de un sándwich o unas papas para picar. Promoción válida en salón durante toda la jornada de jueves.",
      cta: "La primera ronda va por ti. ¿A quién invitas hoy?",
      imageUrl: "/demo-mania/churrascos.jpg",
      compositionDirective: "Vaso de schop de 500cc con condensación fría y gotas corriendo por el cristal sobre barra de madera rústica."
    },
    story: {
      time: "18:30 hrs",
      objective: "Llamado a la acción rápido con sticker de mención",
      hook: "¿Quién paga la primera vuelta de schops?",
      interactiveType: "Caja de Preguntas",
      interactiveLabel: "Caja: 'Etiqueta a tu partner de schop'",
      slideTexts: [
        "Terminó la jornada laboral del jueves.",
        "Schop artesanal a $2.500 toda la noche en Manía.",
        "Menciona a tu amigo: si no te responde en 5 minutos, le toca pagar la ronda 👇"
      ],
      visualRecommendation: "Primer plano de la llave de la chopera sirviendo cerveza ámbar con espuma perfecta. Sticker interactivo."
    }
  },
  {
    day: 12,
    weekday: "Viernes",
    nicheTrend: "Sándwich gigante con queso desbordante (food porn de alto engagement)",
    nicheInsight: "Los videos y fotos de queso caliente estirándose tienen el triple de compartidos que cualquier otro contenido en redes sociales gastronómicas.",
    post: {
      format: "Post",
      headline: "Sándwich Mechada Luco Monumental",
      productName: "Carne Mechada con Doble Queso Mantecoso Derretido",
      price: "$7.990 en pan frica artesanal",
      isPromo: false,
      hasText: false,
      artDirection: {
        layout: "clean_photo",
        layoutLabel: "📸 Fotografía Limpia (Sin Cartel)",
        fontStyle: "clean_minimal",
        fontLabel: "Sin texto en imagen",
        reasoning: "El queso fundido cayendo por los costados del pan frica tostado tiene tanto impacto visual que un cartel publicitario restaría apetitosidad. Foto limpia de alta gama."
      },
      hook: "Si el queso no desborda por los bordes, no es un Luco de Manía.",
      copy: "Carne mechada tierna y jugosa en abundancia, doble porción de queso mantecoso chileno fundido al calor de la plancha y pan frica artesanal bien calentito que aguanta cada mordisco sin desarmarse. Si eres de los que ama la comida honesta y con sabor a casa, este sándwich te va a conquistar.",
      cta: "Pídelo solo o en combo con papas y schop. ¡Te esperamos en la barra!",
      imageUrl: "/demo-mania/churrascos.jpg",
      compositionDirective: "Plano medio cerrado del sándwich cortado por la mitad con el queso mantecoso elástico cayendo sobre la tabla."
    },
    story: {
      time: "20:00 hrs",
      objective: "Disponibilidad de mesas en tiempo real para acelerar reservas",
      hook: "Viernes noche en Manía. Pocas mesas disponibles.",
      interactiveType: "Link WhatsApp",
      interactiveLabel: "Botón: 'Asegurar mi mesa por WhatsApp 🍻'",
      slideTexts: [
        "Viernes noche en marcha.",
        "Cocina al 100%, música en vivo y las mejores vibras.",
        "Toca aquí para avisarnos que vienes en camino 👇"
      ],
      visualRecommendation: "Video de 4 segundos del salón con luz ambiental cálida y brindis entre amigos. Botón directo de WhatsApp."
    }
  },
  {
    day: 13,
    weekday: "Sábado",
    nicheTrend: "Baldes de cerveza con papas para grupos grandes",
    nicheInsight: "Los sábados los grupos de 4 a 6 personas buscan una promo cerrada que solucione la primera hora sin pensar mucho el pedido.",
    post: {
      format: "Post",
      headline: "Balde de 5 Cervezas + Papas Manía",
      productName: "Balde con Hielo y Cervezas Corona/Heineken + Papas Fritas",
      price: "$14.990 (Ahorra un 25%)",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "top_banner",
        layoutLabel: "⬆️ Cabecera Superior",
        fontStyle: "bold_modern",
        fontLabel: "🔥 Bold Impacto",
        reasoning: "Balde metálico con hielo y botellas al centro junto a la bandeja de papas; nuestros agentes diseñaron la cabecera superior para mostrar el valor del pack sin tapar las botellas."
      },
      hook: "La fórmula infalible para abrir la mesa de sábado con tus amigos.",
      copy: "Cinco botellas de cerveza heladas sumergidas en hielo picado más una fuente grande de nuestras papas rústicas con salsas para picar. Llegas, te sientas, pides el balde y te olvidas de todo. Válido durante toda la noche de sábado.",
      cta: "Junta al grupo y caigan a Manía. ¿Quién se anota para hoy?",
      imageUrl: "/demo-mania/feed_promo_ref.jpg",
      compositionDirective: "Balde metálico vintage con botellas heladas y limones cortados, rodeado de papas rústicas doradas."
    },
    story: {
      time: "21:00 hrs",
      objective: "Interacción musical con los comensales",
      hook: "¿Qué tema no puede faltar en la playlist de hoy?",
      interactiveType: "Caja de Preguntas",
      interactiveLabel: "Caja: 'Pide tu canción favorita para el bar 🎶'",
      slideTexts: [
        "Sábado a tablero vuelto en Manía Restobar.",
        "Ponemos la música que tú quieras escuchar.",
        "Escribe tu tema acá y se lo pasamos al encargado de la música 🎧"
      ],
      visualRecommendation: "Foto estética de la barra con luces de colores y la caja de preguntas centrada para que la gente interactúe."
    }
  },
  {
    day: 14,
    weekday: "Domingo",
    nicheTrend: "Combo Pareja / Familiar de fin de ciclo para maximizar pedidos",
    nicheInsight: "El domingo por la noche la gente busca combinar sushi y sándwich para que todos en la casa queden contentos.",
    post: {
      format: "Post",
      headline: "Combo Pareja: Rolls + Sándwich + Papas",
      productName: "2 Hand Rolls + 1 Churrasco Italiano + Papas Fritas",
      price: "$12.990 (Para 2 personas)",
      isPromo: true,
      hasText: true,
      artDirection: {
        layout: "recipe_ingredients",
        layoutLabel: "📋 Ficha Editorial / Atributos",
        fontStyle: "serif_script_mix",
        fontLabel: "📰 Mix Editorial",
        reasoning: "Combo variado con sushi y sándwich; nuestros agentes usaron la Ficha Editorial con tira inferior para desglosar todo lo que incluye la promo sin saturar la composición visual."
      },
      hook: "¿Él quiere sándwich y tú quieres sushi? En Manía no hay que elegir.",
      copy: "Armamos el combo definitivo para cuando no se ponen de acuerdo: dos hand rolls apanados crocantes rellenos de pollo y palta, más un churrasco italiano gigante en pan frica tostado con palta y tomate, acompañado de una porción de papas fritas doradas. Todos felices y la cena resuelta en un solo pedido.",
      cta: "Pídelo por WhatsApp para llevar a casa o disfruta tu domingo en nuestro salón.",
      imageUrl: "/demo-mania/hand_rolls.jpg",
      compositionDirective: "Composición dual armónica: tabla con hand rolls a un lado y sándwich churrasco cortado al otro, papas al centro."
    },
    story: {
      time: "19:30 hrs",
      objective: "Agradecimiento a la comunidad y llamado al delivery de domingo",
      hook: "Gracias por llenar la casa este fin de semana ❤️",
      interactiveType: "Link WhatsApp",
      interactiveLabel: "Botón: 'Pedir Combo Pareja al WhatsApp 📲'",
      slideTexts: [
        "Gracias a todos los que nos acompañaron de lunes a domingo en Manía.",
        "Si hoy te quedas en casa, cerramos la semana llevándote lo mejor de nuestra cocina.",
        "Pide el Combo Pareja por WhatsApp y disfruta tu domingo 👇"
      ],
      visualRecommendation: "Collage suave de los mejores platos del fin de semana con agradecimiento sincero y botón de pedido."
    }
  }
];

export default function DemoPlanManiaPage() {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [filterType, setFilterType] = useState<"all" | "promo" | "with_text" | "without_text">("all");
  const [viewTab, setViewTab] = useState<"feed" | "story" | "art_direction" | "niche">("feed");
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const activeItem = MANIA_14_DAYS_PLAN.find((item) => item.day === selectedDay) || MANIA_14_DAYS_PLAN[0];

  const filteredDays = MANIA_14_DAYS_PLAN.filter((item) => {
    if (filterType === "promo") return item.post.isPromo;
    if (filterType === "with_text") return item.post.hasText;
    if (filterType === "without_text") return !item.post.hasText;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-rose-500 selection:text-white">
      {/* HEADER PRINCIPAL */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 flex items-center justify-center text-xl shadow-lg shadow-rose-900/30">
              🍻
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">
                  Demostración en Vivo
                </span>
                <span className="text-xs text-slate-400 font-medium">Manía Restobar</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                Planificación 14 Días · Radar de Nicho
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/automatizacion-rrss/panel/estrategia"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
            >
              <span>←</span> Volver a Estrategia
            </Link>
            <Link
              href="/automatizacion-rrss/panel/catalogo"
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <span>🔥</span> Ir a Mis Promociones
            </Link>
          </div>
        </div>
      </header>

      {/* BANNER DE INTELIGENCIA DE NICHO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-800/40 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Radar de Nicho Activo: Restobar, Sushi & Coctelería Nocturna
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-xs text-slate-300 font-medium max-w-3xl leading-relaxed">
                Nuestros agentes analizaron el feed histórico de <strong>Manía Restobar</strong> junto a las tendencias de consumo gastronómico en Chile: combinamos combos de alto volumen (churrascos y hand rolls), días de coctelería 2x1, tablas para compartir y alternancia equilibrada de <strong>imágenes con cartel publicitario</strong> y <strong>fotografías limpias de apetito visual</strong>.
              </p>
            </div>

            {/* METRICAS DEL PLAN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <div className="text-base font-black text-rose-400">14</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posts de Feed</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <div className="text-base font-black text-amber-400">14</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historias Diarias</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <div className="text-base font-black text-indigo-400">9 / 5</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Con / Sin Texto</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <div className="text-base font-black text-emerald-400">100%</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tono Humano</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS Y SELECTOR DE DIAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            <span className="text-[11px] text-slate-400 mr-2 shrink-0">Filtrar por:</span>
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "all" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Todos los 14 Días
            </button>
            <button
              onClick={() => setFilterType("promo")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "promo" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🔥 Solo Promociones ({MANIA_14_DAYS_PLAN.filter((i) => i.post.isPromo).length})
            </button>
            <button
              onClick={() => setFilterType("with_text")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "with_text" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏷️ Con Texto ({MANIA_14_DAYS_PLAN.filter((i) => i.post.hasText).length})
            </button>
            <button
              onClick={() => setFilterType("without_text")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "without_text" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📸 Sin Texto ({MANIA_14_DAYS_PLAN.filter((i) => !i.post.hasText).length})
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Selecciona un día en la barra inferior para ver su post e historia
          </div>
        </div>

        {/* Cintas de días 1 al 14 */}
        <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2">
          {filteredDays.map((item) => {
            const isSelected = item.day === selectedDay;
            return (
              <button
                key={item.day}
                onClick={() => setSelectedDay(item.day)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? "bg-gradient-to-b from-rose-900/90 to-rose-950 border-rose-500 shadow-lg shadow-rose-950/50 scale-102"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase ${isSelected ? "text-rose-300" : "text-slate-400"}`}>
                    Día {item.day}
                  </span>
                  <span className="text-xs">{item.post.isPromo ? "🔥" : "✨"}</span>
                </div>
                <div className="mt-1">
                  <div className="text-xs font-black text-white truncate">{item.weekday}</div>
                  <div className="text-[9px] text-slate-400 font-bold truncate mt-0.5">
                    {item.post.hasText ? "🏷️ Con texto" : "📸 Limpia"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CONTENEDOR PRINCIPAL: DETALLE DEL DÍA SELECCIONADO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Header del Día */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white tracking-wide uppercase">
                  Día {activeItem.day} · {activeItem.weekday}
                </span>
                {activeItem.post.isPromo && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    🔥 Promoción Comercial
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-300 border border-slate-700">
                  {activeItem.post.hasText ? "🏷️ Imagen CON Texto de Oferta" : "📸 Fotografía Limpia Sin Texto"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {activeItem.post.headline}
              </h2>
              <p className="text-xs text-rose-300/80 font-medium flex items-center gap-1.5">
                <span>🎯 Oportunidad detectada por nuestros agentes:</span>
                <span className="italic">{activeItem.nicheTrend}</span>
              </p>
            </div>

            {/* Selector de pestañas internas */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold self-start lg:self-center">
              <button
                onClick={() => setViewTab("feed")}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  viewTab === "feed" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                📸 Post de Feed
              </button>
              <button
                onClick={() => setViewTab("story")}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  viewTab === "story" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                📱 Historia Diaria (Story)
              </button>
              <button
                onClick={() => setViewTab("art_direction")}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  viewTab === "art_direction" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                🎨 Dirección de Arte
              </button>
              <button
                onClick={() => setViewTab("niche")}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  viewTab === "niche" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                📡 Radar de Nicho
              </button>
            </div>
          </div>

          {/* CONTENIDO DE LA PESTAÑA SELECCIONADA */}
          {viewTab === "feed" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Mockup del Feed (Columna Izquierda 5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-400 flex items-center justify-center font-bold text-xs text-white">
                        MR
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">maniarestobar</div>
                        <div className="text-[10px] text-slate-400">Manía Restobar · Coquimbo / La Serena</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">•••</span>
                  </div>

                  {/* Imagen de la publicación con Badge visual si es con texto */}
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group cursor-pointer"
                    onClick={() => setSelectedImageModal(activeItem.post.imageUrl)}
                  >
                    <img
                      src={activeItem.post.imageUrl}
                      alt={activeItem.post.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {activeItem.post.hasText ? (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 p-4 flex flex-col justify-between pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md">
                            🔥 {activeItem.post.price}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold border border-white/20">
                            {activeItem.post.artDirection.layoutLabel}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                            MANÍA RESTOBAR
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                            {activeItem.post.headline}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white border border-white/20">
                        📸 Fotografía Limpia
                      </div>
                    )}
                  </div>

                  {/* Barra de Interacciones */}
                  <div className="flex items-center justify-between text-slate-300 pt-1 px-1">
                    <div className="flex items-center gap-3 text-lg">
                      <span>❤️</span>
                      <span>💬</span>
                      <span>↗️</span>
                    </div>
                    <span>🔖</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400">
                  💡 Haz clic sobre la foto para verla en pantalla completa de alta fidelidad.
                </div>
              </div>

              {/* Copywriting Humanizado & Detalles (Columna Derecha 7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Caja de Hook */}
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block">
                    🎣 Hook de Primer Segundo
                  </span>
                  <p className="text-sm sm:text-base font-black text-white leading-snug">
                    "{activeItem.post.hook}"
                  </p>
                </div>

                {/* Texto del Post Humanizado */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      📝 Copywriting Persuasivo (Tú a tú · Sin relleno de IA)
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${activeItem.post.hook}\n\n${activeItem.post.copy}\n\n${activeItem.post.cta}`)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/60 border border-rose-900/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Copiar Copy
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                    {activeItem.post.copy}
                  </p>
                  <div className="pt-3 border-t border-slate-800 text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                    <span>👉</span>
                    <span>{activeItem.post.cta}</span>
                  </div>
                </div>

                {/* Resumen de Dirección de Arte */}
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      🎯 Justificación del Agente Director de Arte
                    </span>
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded-full">
                      {activeItem.post.artDirection.layoutLabel} · {activeItem.post.artDirection.fontLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                    "{activeItem.post.artDirection.reasoning}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO PESTAÑA: HISTORIA DIARIA (STORY) */}
          {viewTab === "story" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Mockup Vertical 9:16 de la Story */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[300px] aspect-[9/16] rounded-3xl bg-slate-950 border-2 border-slate-700 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <img
                    src={activeItem.post.imageUrl}
                    alt="Story visual"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>

                  {/* Barra superior de Instagram Stories */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex gap-1">
                      <div className="h-1 flex-1 bg-white rounded-full"></div>
                      <div className="h-1 flex-1 bg-white/40 rounded-full"></div>
                      <div className="h-1 flex-1 bg-white/40 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white">
                        M
                      </div>
                      <span className="text-[11px] font-black text-white">maniarestobar</span>
                      <span className="text-[10px] text-slate-400">hace {activeItem.story.time}</span>
                    </div>
                  </div>

                  {/* Texto central de la historia */}
                  <div className="relative z-10 text-center space-y-2 px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-black/60 px-2 py-0.5 rounded-full inline-block">
                      {activeItem.story.objective}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white drop-shadow-lg leading-tight">
                      "{activeItem.story.hook}"
                    </h3>
                  </div>

                  {/* Sticker interactivo simulado */}
                  <div className="relative z-10 space-y-2">
                    <div className="p-3 rounded-2xl bg-white/95 text-slate-900 shadow-xl text-center space-y-1 backdrop-blur-md">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 block">
                        Sticker {activeItem.story.interactiveType}
                      </span>
                      <p className="text-xs font-black">{activeItem.story.interactiveLabel}</p>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-xs px-2">
                      <span>Enviar mensaje...</span>
                      <span>❤️</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guión y Recomendación Técnica de la Story */}
              <div className="lg:col-span-7 space-y-5">
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      ⚡ Estrategia de la Historia del Día
                    </span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800">
                      Hora sugerida: {activeItem.story.time}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">
                    Objetivo: {activeItem.story.objective}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Diseñada con copywriting ultra-corto (máximo 125 caracteres por slide según nuestro skill de Stories) para retener la atención inmediata y generar respuesta al mensaje directo o activación de venta.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    📜 Guión de Pantalla (Secuencia de 3 Slides)
                  </span>
                  <div className="space-y-2.5">
                    {activeItem.story.slideTexts.map((text, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 font-bold leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    🎥 Pauta de Grabación & Audio Sugerido
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeItem.story.visualRecommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO PESTAÑA: DIRECCIÓN DE ARTE */}
          {viewTab === "art_direction" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400">
                  Análisis Autónomo del Agente Director de Arte para este Post
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Para cada imagen del calendario, nuestros agentes determinaron si convenía superponer carteles publicitarios o dejar la fotografía limpia. En caso de llevar texto, definieron la disposición y la tipografía exacta según la composición de la escena.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Disposición Espacial (Layout)
                  </span>
                  <h4 className="text-base font-black text-white">{activeItem.post.artDirection.layoutLabel}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeItem.post.artDirection.layout === "split_left" &&
                      "El producto se ubica a la derecha dejando el 50% izquierdo con fondo suave para colocar el precio, titular y botón de acción sin tapar la comida."}
                    {activeItem.post.artDirection.layout === "split_right" &&
                      "El sujeto se ubica a la izquierda y el bloque informativo a la derecha, logrando balance visual asimétrico de nivel editorial."}
                    {activeItem.post.artDirection.layout === "top_banner" &&
                      "Titular e insignia en la cabecera superior y barra de acción en la base; el tercio central queda completamente libre para el producto."}
                    {activeItem.post.artDirection.layout === "recipe_ingredients" &&
                      "Ficha con cabecera superior y tira inferior de beneficios/atributos, ideal para combos y packs familiares."}
                    {activeItem.post.artDirection.layout === "clean_photo" &&
                      "Fotografía 100% limpia sin textos sobrepuestos. Todo el precio y detalles se canalizan exclusivamente en el texto del copy."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Estilo Tipográfico
                  </span>
                  <h4 className="text-base font-black text-white">{activeItem.post.artDirection.fontLabel}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeItem.post.artDirection.fontStyle === "bold_modern" &&
                      "Fuentes condensadas de alto impacto (Bebas Neue / Anton) ideales para ofertas comerciales, combos y precios fuertes en restobares."}
                    {activeItem.post.artDirection.fontStyle === "serif_script_mix" &&
                      "Titular serif con remate en cursiva para transmitir calidad de autor y experiencia de restobar gourmet."}
                    {activeItem.post.artDirection.fontStyle === "clean_minimal" &&
                      "Líneas limpias y modernas que no compiten con la textura de la comida."}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Directiva Fotográfica Inyectada en el Prompt
                </span>
                <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-xl border border-slate-850">
                  {activeItem.post.compositionDirective}
                </p>
              </div>
            </div>
          )}

          {/* CONTENIDO PESTAÑA: RADAR DE NICHO */}
          {viewTab === "niche" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                  Por qué nuestros agentes eligieron este contenido para el Día {activeItem.day}
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {activeItem.nicheInsight}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Comportamiento del Consumidor</span>
                  <p className="text-xs text-slate-300 font-medium">
                    Los días {activeItem.weekday.toLowerCase()} el usuario busca {activeItem.day <= 4 ? "precios accesibles para no cocinar en casa" : "experiencias para compartir y cortar la rutina con amigos"}.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Rol en el Embudo</span>
                  <p className="text-xs text-slate-300 font-medium">
                    {activeItem.post.isPromo ? "Conversión directa de venta y activación de reservas inmediatas." : "Autoridad de marca y retención mediante deseo visual gastronómico."}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Canal de Cierre</span>
                  <p className="text-xs text-slate-300 font-medium">
                    WhatsApp para pedidos con retiro o DM para reservas de mesas en el salón nocturno.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PARA VER LA IMAGEN EN GRANDE */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <img src={selectedImageModal} alt="Preview Grande" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border border-white/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

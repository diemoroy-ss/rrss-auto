"use client";

import { useState } from "react";
import Link from "next/link";

interface Option {
  key: string;
  text: string;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
  correctAnswers: string[];
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: "Los tres pilares del empirismo son:",
    options: [
      { key: "a", text: "Coraje, apertura e inspección" },
      { key: "b", text: "Transparencia, inspección y adaptación" },
      { key: "c", text: "Multifuncionalidad, autoorganización y transparencia" },
      { key: "d", text: "Agilidad empresarial, multifuncionalidad y autogestión" }
    ],
    correctAnswers: ["b"],
    explanation: "El empirismo se basa en tres pilares fundamentales: Transparencia (hacer visible el trabajo), Inspección (evaluar el progreso con frecuencia) y Adaptación (ajustar el proceso o el producto ante cualquier desviación)."
  },
  {
    id: 2,
    text: "El empirismo significa que:",
    options: [
      { key: "a", text: "Las decisiones se basan en lo que ha sucedido" },
      { key: "b", text: "Las decisiones se basan en la intuición empresarial" },
      { key: "c", text: "Las decisiones se basan en predicciones" },
      { key: "d", text: "Ninguna de las anteriores" }
    ],
    correctAnswers: ["a"],
    explanation: "El empirismo afirma que el conocimiento proviene de la experiencia y que la toma de decisiones se realiza basándose en hechos observados y en lo que realmente ha ocurrido, no en suposiciones o planes a largo plazo."
  },
  {
    id: 3,
    text: "Scrum es:",
    options: [
      { key: "a", text: "Una metodología completa que te dice cómo cumplir con los OKRs de tu empresa" },
      { key: "b", text: "Una guía para gestionar recursos humanos y departamentos de TI" },
      { key: "c", text: "Un marco de trabajo de proceso que prospera con equipos autogestionados" },
      { key: "d", text: "Una metodología para habilitar equipos autogestionados" }
    ],
    correctAnswers: ["c"],
    explanation: "Scrum no es una metodología detallada ni un proceso completo; es un marco de trabajo (framework) liviano dentro del cual las personas pueden abordar problemas complejos y adaptativos, y que fomenta equipos autogestionados y multifuncionales."
  },
  {
    id: 4,
    text: "Los valores de Scrum son:",
    options: [
      { key: "a", text: "Coraje, Foco, Compromiso, Autonomía, Transparencia" },
      { key: "b", text: "Transparencia, Inspección, Adaptación" },
      { key: "c", text: "Autoorganización, multifuncionalidad" },
      { key: "d", text: "Coraje, Foco, Compromiso, Respeto, Apertura" }
    ],
    correctAnswers: ["d"],
    explanation: "Los cinco valores oficiales descritos en la Guía de Scrum son: Compromiso (Commitment), Foco (Focus), Apertura (Openness), Respeto (Respect) y Coraje (Courage). El éxito de Scrum depende de que las personas vivan estos valores."
  },
  {
    id: 5,
    text: "Entre otras responsabilidades, el Scrum Master es quien debe gestionar a los interesados (stakeholders) e invitarlos al Sprint Review:",
    options: [
      { key: "a", text: "Verdadero, el Scrum Master sirve a toda la organización" },
      { key: "b", text: "Falso, eso cae más en el ámbito del Product Owner" }
    ],
    correctAnswers: ["b"],
    explanation: "Es el Product Owner quien gestiona las relaciones con los interesados y coordina su participación en el Sprint Review, ya que es el responsable de maximizar el valor del producto y entender las necesidades del negocio."
  },
  {
    id: 6,
    text: "¿Cuál es una buena manera de aumentar la transparencia de un Incremento de Producto?",
    options: [
      { key: "a", text: "Informar el progreso a los interesados en la reunión del Daily Scrum" },
      { key: "b", text: "Mantener las tareas actualizadas en el sistema digital de gestión de tickets" },
      { key: "c", text: "Realizar todo el trabajo necesario para satisfacer la definición de Terminado (Done), según lo establecido por la organización de desarrollo o el Scrum Team" },
      { key: "d", text: "Crear un Product Backlog separado para cada componente del producto" },
      { key: "e", text: "Crear un Sprint Backlog separado para cada componente del producto" }
    ],
    correctAnswers: ["c"],
    explanation: "La transparencia aumenta cuando el incremento cumple estrictamente con la Definición de Terminado (Definition of Done). Esto asegura que todos entiendan con exactitud qué significa que algo esté finalizado y que la calidad del incremento sea real."
  },
  {
    id: 7,
    text: "Cuando los Desarrolladores han seleccionado una cantidad de elementos del Product Backlog durante el Sprint Planning (elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Los Desarrolladores garantizan que todos los elementos seleccionados del Product Backlog se entregarán al final del Sprint" },
      { key: "b", text: "Los Desarrolladores se comprometen con el objetivo del Sprint (Sprint Goal) y a dar lo mejor de sí para alcanzarlo" },
      { key: "c", text: "Si alguno de los elementos del Product Backlog no cumple con la definición de Terminado (Done) al final del Sprint, el Product Owner podría extender la duración del Sprint" },
      { key: "d", text: "Los Desarrolladores realizan una proyección (forecast) de la funcionalidad que se entregará durante el Sprint" }
    ],
    correctAnswers: ["b", "d"],
    explanation: "Los Desarrolladores no dan garantías absolutas, sino que realizan una proyección (forecast) del trabajo que creen que pueden completar. El verdadero compromiso de los Desarrolladores es con el Sprint Goal (Objetivo del Sprint)."
  },
  {
    id: 8,
    text: "Cuando un equipo es multifuncional (cross-functional), significa que sus miembros solo deben trabajar en un único componente o capa de un sistema:",
    options: [
      { key: "a", text: "Verdadero" },
      { key: "b", text: "Falso" }
    ],
    correctAnswers: ["b"],
    explanation: "Multifuncional significa que el equipo en conjunto tiene todas las habilidades necesarias para entregar un incremento terminado. No significa que los miembros deban trabajar aislados en silos o en una sola capa de la arquitectura."
  },
  {
    id: 9,
    text: "La multifuncionalidad implica que:",
    options: [
      { key: "a", text: "Los Desarrolladores solo entregan sus tareas a los evaluadores (testers) una vez por Sprint" },
      { key: "b", text: "Los Desarrolladores son profesionales con todas las habilidades necesarias para entregar un Incremento de funcionalidad" },
      { key: "c", text: "Los Desarrolladores deben ser ingenieros y evaluadores (testers)" },
      { key: "d", text: "Los Desarrolladores podrían solo necesitar consultar con arquitectos y analistas de negocio de otros departamentos" }
    ],
    correctAnswers: ["b"],
    explanation: "La multifuncionalidad de los Desarrolladores significa que, como colectivo, cuentan con todas las capacidades técnicas (programación, pruebas, diseño, etc.) para crear un incremento de valor sin depender de equipos externos."
  },
  {
    id: 10,
    text: "¿Quién estima el tamaño de un elemento del Product Backlog?",
    options: [
      { key: "a", text: "Los Desarrolladores, una vez que su contenido ha sido aclarado con el Product Owner" },
      { key: "b", text: "El Scrum Master, en consulta con los Desarrolladores" },
      { key: "c", text: "El Product Owner, teniendo en cuenta las mejores estimaciones proporcionadas por los Desarrolladores" },
      { key: "d", text: "Los Desarrolladores más experimentados, o aquellos que son expertos en el dominio de ese elemento del Product Backlog" },
      { key: "e", text: "Las estimaciones son una fuente de desperdicio que debería ser eliminada por el Scrum Master" },
      { key: "f", text: "El director de proyecto (project manager), en colaboración con el Product Owner" }
    ],
    correctAnswers: ["a"],
    explanation: "Los Desarrolladores que realizarán el trabajo son los responsables de realizar la estimación del tamaño de los elementos del Product Backlog, tras la aclaración del Product Owner, quien les provee el contexto de negocio."
  },
  {
    id: 11,
    text: "¿Cuánto trabajo debe dedicarse a cada elemento del Product Backlog seleccionado para el Sprint actual?",
    options: [
      { key: "a", text: "Tanto como sea posible, y si no se completó, se agregará inmediatamente al siguiente Sprint" },
      { key: "b", text: "Tanto como sea necesario para cumplir con la Definición de Terminado (Definition of Done) y formar parte de un Incremento de Producto desplegable/liberable" },
      { key: "c", text: "Tanto como lo indique el Scrum Master, siguiendo las especificaciones del Product Owner" },
      { key: "d", text: "Tanto como cada desarrollador considere apropiado para tener alguna funcionalidad lista para pruebas" }
    ],
    correctAnswers: ["b"],
    explanation: "Cada elemento seleccionado en el Sprint debe desarrollarse hasta que satisfaga completamente la Definición de Terminado (DoD), asegurando que el incremento final sea utilizable y cumpla con los estándares de calidad del producto."
  },
  {
    id: 12,
    text: "¿Cómo promueve Scrum los equipos autotratados/autogestionados? (Elige las tres mejores respuestas)",
    options: [
      { key: "a", text: "Evitando que el CEO y otros interesados proporcionen cualquier tipo de feedback" },
      { key: "b", text: "Proporcionando un marco de trabajo liviano que consta de una serie de responsabilidades, eventos, artefactos y reglas" },
      { key: "c", text: "Mediante la selección por parte de los Desarrolladores de su propio trabajo a realizar en cada Sprint" },
      { key: "d", text: "Al no reconocer títulos ni jerarquías" },
      { key: "e", text: "Al no permitir el contacto con los clientes, lo que ralentizaría el proceso de desarrollo" }
    ],
    correctAnswers: ["b", "c", "d"],
    explanation: "Scrum fomenta la autogestión al no reconocer jerarquías ni cargos internos dentro del equipo, permitiendo que los Desarrolladores organicen su propio trabajo, y estructurando la interacción mediante reglas y artefactos sencillos."
  },
  {
    id: 13,
    text: "El Scrum Master es (elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Una responsabilidad obligatoria en Scrum" },
      { key: "b", text: "El gerente ágil de los Desarrolladores" },
      { key: "c", text: "Un verdadero líder que apoya la adopción de Scrum" },
      { key: "d", text: "Quien decide qué mejoras identificadas en la Retrospectiva del Sprint deben implementarse" }
    ],
    correctAnswers: ["a", "c"],
    explanation: "El Scrum Master es un rol obligatorio en todo equipo Scrum y actúa como un verdadero líder que sirve al Scrum Team y a la organización en general para entender y adoptar el marco de trabajo Scrum."
  },
  {
    id: 14,
    text: "Como parte de las responsabilidades del Scrum Master:",
    options: [
      { key: "a", text: "El Scrum Master debe eliminar todos los impedimentos que puedan afectar al desarrollo" },
      { key: "b", text: "El Scrum Master solo debe eliminar los impedimentos relacionados con la composición y estructura del Scrum Team" },
      { key: "c", text: "El Scrum Master solo elimina aquellos impedimentos que superan las capacidades de autogestión del Scrum Team" },
      { key: "d", text: "El Scrum Master debe eliminar todos los impedimentos que puedan afectar al Scrum Team, planteándolos ante la alta dirección si es necesario" }
    ],
    correctAnswers: ["c"],
    explanation: "El equipo debe intentar resolver sus problemas primero. El Scrum Master interviene para remover aquellos impedimentos que el equipo no puede solucionar por sí mismo debido a limitaciones de autoridad o alcance organizativo."
  },
  {
    id: 15,
    text: "El Scrum Master (elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Debe ser a tiempo completo, de lo contrario el equipo no está haciendo Scrum" },
      { key: "b", text: "Debería ser asumido por el desarrollador más experimentado del equipo" },
      { key: "c", text: "Debe existir para que el equipo esté haciendo Scrum" },
      { key: "d", text: "En teoría, aunque no es recomendado, podría ser a tiempo parcial y podría rotar entre los miembros del equipo" }
    ],
    correctAnswers: ["c", "d"],
    explanation: "La responsabilidad del Scrum Master debe existir obligatoriamente para cumplir con el framework. Aunque no es ideal para el enfoque y la estabilidad, la Guía de Scrum permite que sea un rol compartido o rotativo si el equipo así lo autogestiona."
  },
  {
    id: 16,
    text: "Un desarrollador le dice al Scrum Master, en privado, que le preocupa la falta de pruebas automatizadas y sus riesgos potenciales. ¿Qué debería hacer este Scrum Master?",
    options: [
      { key: "a", text: "Agregar un elemento al Product Backlog para que el equipo implemente pruebas automatizadas lo antes posible" },
      { key: "b", text: "Informar inmediatamente el problema al Product Owner para que el objetivo del Sprint pueda cambiarse si es necesario" },
      { key: "c", text: "Pedir al desarrollador que comparta sus preocupaciones con el resto del equipo lo antes posible, tal vez en la próxima Retrospectiva" },
      { key: "d", text: "Solicitar a la alta dirección un presupuesto adicional para cubrir estas pruebas lo antes posible" }
    ],
    correctAnswers: ["c"],
    explanation: "El Scrum Master no debe resolver las cosas de manera autocrática ni actuar a espaldas del equipo. Su rol es facilitar la autogestión del equipo invitando a que los problemas técnicos se debatan en grupo, idealmente durante la Retrospectiva."
  },
  {
    id: 17,
    text: "Uno de los desarrolladores se está comportando de manera inapropiada, y no solo no entrega sus tareas, sino que también discute constantemente con otros miembros del equipo. ¿Quién sería responsable de remover a este desarrollador del equipo, si la situación llegara a ese extremo?",
    options: [
      { key: "a", text: "El Scrum Master" },
      { key: "b", text: "El Product Owner" },
      { key: "c", text: "Los Desarrolladores, aunque podrían necesitar la ayuda del Scrum Master" },
      { key: "d", text: "El Scrum Manager" }
    ],
    correctAnswers: ["c"],
    explanation: "Los Desarrolladores son autogestionados y dueños de su proceso y dinámica interna. Si un miembro afecta gravemente al equipo, los Desarrolladores (con asistencia de facilitación del Scrum Master si es necesario) deben resolverlo."
  },
  {
    id: 18,
    text: "¿Quién debe realizar el seguimiento del progreso del trabajo durante un Sprint?",
    options: [
      { key: "a", text: "El Scrum Master" },
      { key: "b", text: "El Scrum Master, en colaboración con los Desarrolladores" },
      { key: "c", text: "El Product Owner" },
      { key: "d", text: "Los Desarrolladores" }
    ],
    correctAnswers: ["d"],
    explanation: "Los Desarrolladores son los únicos responsables de gestionar su propio Sprint Backlog y monitorear el progreso del trabajo diario (por ejemplo, en el Daily Scrum) para asegurarse de cumplir con el objetivo del Sprint."
  },
  {
    id: 19,
    text: "El Scrum Master es responsable de (elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Configurar cada evento de Scrum" },
      { key: "b", text: "Gestionar a los Desarrolladores" },
      { key: "c", text: "Gestionar impedimentos" },
      { key: "d", text: "Eliminar todos los impedimentos que bloquean a los Desarrolladores" },
      { key: "e", text: "La correcta adopción y uso del marco de trabajo Scrum" }
    ],
    correctAnswers: ["c", "e"],
    explanation: "El Scrum Master es responsable de asegurar que Scrum se entienda y se adopte correctamente conforme a la teoría del framework, así como de ayudar a eliminar o gestionar impedimentos que excedan la capacidad de autogestión del equipo."
  },
  {
    id: 20,
    text: "El CTO solicita un informe de progreso a los Desarrolladores. Los Desarrolladores hablan con el Scrum Master buscando su consejo. ¿Qué debería hacer el Scrum Master en esta situación?",
    options: [
      { key: "a", text: "Permitir que los Desarrolladores se autogestionen y decidan qué hacer por sí mismos" },
      { key: "b", text: "Eliminar el impedimento creando el informe ella misma, colaborando con los Desarrolladores" },
      { key: "c", text: "Explicar al CTO que tendrá la oportunidad de ver el progreso del Incremento en el Sprint Review" },
      { key: "d", text: "Eliminar el impedimento creando el informe ella misma, solicitando asistencia del Product Owner si es necesario" },
      { key: "e", text: "Asegurar que los Desarrolladores entreguen el informe al final del Sprint" }
    ],
    correctAnswers: ["c"],
    explanation: "En Scrum, el progreso se mide inspeccionando incrementos de software que funcionen. El Scrum Master debe proteger al equipo de la burocracia y explicar a los directivos que el evento adecuado para revisar el progreso real es el Sprint Review."
  },
  {
    id: 21,
    text: "El rol del Product Owner (elige las tres mejores respuestas):",
    options: [
      { key: "a", text: "Es siempre un comité" },
      { key: "b", text: "Es una sola persona, que puede delegar ciertas tareas" },
      { key: "c", text: "Puede representar a un comité" },
      { key: "d", text: "Es responsable de gestionar el Product Backlog" },
      { key: "e", text: "Es responsable de gestionar el Sprint Backlog" }
    ],
    correctAnswers: ["b", "c", "d"],
    explanation: "El Product Owner es una sola persona física para garantizar decisiones rápidas y claras. Puede representar los requisitos o deseos de un comité completo de stakeholders, y es responsable absoluto de la gestión del Product Backlog."
  },
  {
    id: 22,
    text: "El Product Owner de un equipo ha sido reemplazado por uno nuevo. Ella no tiene mucha experiencia y se pregunta qué cosas debería hacer. (Elige las tres mejores respuestas):",
    options: [
      { key: "a", text: "Colaborar y escuchar a los interesados (clientes, usuarios, gerencia, etc.)" },
      { key: "b", text: "Escribir especificaciones completas para cada elemento del Product Backlog" },
      { key: "c", text: "Gestionar el Product Backlog de manera que se maximice el valor entregado por los Desarrolladores" },
      { key: "d", text: "Colaborar con los Desarrolladores para asegurar que el Product Backlog esté suficientemente refinado" },
      { key: "e", text: "Crear un proceso para producir Casos de Uso e Historias de Usuario" }
    ],
    correctAnswers: ["a", "c", "d"],
    explanation: "Las principales tareas del Product Owner consisten en escuchar a los interesados para entender sus necesidades, ordenar y refinar el Product Backlog con los Desarrolladores y enfocar el backlog para maximizar el valor del incremento resultante."
  },
  {
    id: 23,
    text: "¿Quién decide cómo se hace el trabajo durante cada Sprint?",
    options: [
      { key: "a", text: "El Product Owner" },
      { key: "b", text: "El Scrum Master" },
      { key: "c", text: "Los Desarrolladores" },
      { key: "d", text: "El Product Owner, in consulta con los Desarrolladores y el Scrum Master" }
    ],
    correctAnswers: ["c"],
    explanation: "Los Desarrolladores son completamente autónomos en cuanto a las decisiones técnicas y operativas necesarias para implementar y finalizar los ítems de backlog comprometidos durante el Sprint."
  },
  {
    id: 24,
    text: "¿Quién es responsable de mantener los elementos del Product Backlog claramente articulados?",
    options: [
      { key: "a", text: "El Product Owner" },
      { key: "b", text: "El Scrum Master" },
      { key: "c", text: "Los Desarrolladores, en colaboración con el Product Owner" },
      { key: "d", text: "El Comité de Producto" },
      { key: "e", text: "El Scrum Master, siguiendo instrucciones del Product Owner" }
    ],
    correctAnswers: ["a"],
    explanation: "El Product Owner es el responsable único de la gestión del Product Backlog, lo cual incluye redactar y mantener sus elementos de forma clara y entendible para el equipo y los stakeholders."
  },
  {
    id: 25,
    text: "¿Por qué debería haber un solo Product Owner para cada producto? (Elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Para asignar claramente la responsabilidad del éxito o fracaso del producto" },
      { key: "b", text: "Para que el Scrum Master pueda cubrir fácilmente el rol del Product Owner cuando este de vacaciones" },
      { key: "c", text: "Permite la toma de decisiones ágil y los Desarrolladores saben quién decide el orden del Product Backlog" },
      { key: "d", text: "El Scrum Master puede eliminar fácilmente cualquier impedimento solicitando recursos adicionales al Product Owner" },
      { key: "e", text: "Asegura que los Desarrolladores informen a una sola persona" }
    ],
    correctAnswers: ["a", "c"],
    explanation: "Tener un solo Product Owner por producto centraliza la toma de decisiones del Backlog, acelera las prioridades para los Desarrolladores y define un único punto de rendición de cuentas para el retorno de inversión del producto."
  },
  {
    id: 26,
    text: "Con respecto al Daily Scrum:",
    options: [
      { key: "a", text: "El time-box (tiempo límite) es de 15 minutos" },
      { key: "b", text: "El time-box es de 10 minutos" },
      { key: "c", text: "El time-box es de 5 minutos" },
      { key: "e", text: "Cada miembro debe estar de pie para la reunión" },
      { key: "f", text: "Cada Desarrollador puede hablar un máximo de 30 segundos" }
    ],
    correctAnswers: ["a"],
    explanation: "El Daily Scrum es un evento diario de exactamente 15 minutos enfocado en sincronizar el trabajo de los Desarrolladores y ajustar su plan de 24 horas. No hay reglas obligatorias de estar de pie."
  },
  {
    id: 27,
    text: "¿Cuáles de los siguientes son eventos regulares en Scrum? (Elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Sprint Review" },
      { key: "b", text: "Sesiones de refinamiento (Refinement)" },
      { key: "c", text: "Sprint Retrospective" },
      { key: "d", text: "Reunión de gestión de lanzamientos" },
      { key: "e", text: "Reunión de Story Mapping" }
    ],
    correctAnswers: ["a", "c"],
    explanation: "Los eventos formales de Scrum son el Sprint, Sprint Planning, Daily Scrum, Sprint Review y Sprint Retrospective. Las sesiones de refinamiento de backlog se consideran una actividad continua, no un evento formal."
  },
  {
    id: 28,
    text: "¿Cuándo comienza un Sprint?",
    options: [
      { key: "a", text: "Tan pronto como termina el Sprint anterior" },
      { key: "b", text: "Una vez que concluye la fase de integración después del Sprint anterior" },
      { key: "c", text: "Cuando el Product Owner establece la nueva fecha para este" },
      { key: "d", text: "Cuando el Scrum Master establece la nueva fecha para este" },
      { key: "e", text: "Cuando finalizan las pruebas" }
    ],
    correctAnswers: ["a"],
    explanation: "Para mantener un ritmo constante y predecible, los Sprints son consecutivos. Un Sprint comienza inmediatamente después de que termina el anterior, sin periodos de espera ni sitemas de transición."
  },
  {
    id: 29,
    text: "El Sprint Review:",
    options: [
      { key: "a", text: "Permite al Scrum Team optimizar su proceso, identificando mejoras potenciales" },
      { key: "b", text: "Fomenta la colaboración entre el equipo y los interesados, basándose en los resultados del Sprint" },
      { key: "c", text: "Se utiliza como una reunión formal de informe de estado" },
      { key: "d", text: "Permite al Scrum Master realizar una demostración (demo) del Incremento de Producto" }
    ],
    correctAnswers: ["b"],
    explanation: "El objetivo del Sprint Review es inspeccionar el incremento obtenido durante el Sprint, presentar los logros a los interesados y adaptar colaborativamente el Product Backlog basándose en la retroalimentación recibida."
  },
  {
    id: 30,
    text: "Durante la reunión de Sprint Planning:",
    options: [
      { key: "a", text: "El Scrum Master asigna el trabajo a cada desarrollador" },
      { key: "b", text: "Todo el Sprint Backlog debe ser definido y estimado" },
      { key: "c", text: "El equipo de desarrollo debe crear una proyección de lo que puede entregar, y definir suficiente trabajo para los primeros días del Sprint" },
      { key: "d", text: "El equipo de desarrollo define la arquitectura del sistema durante el Sprint 0, ya que los cambios futuros en ella podrían ser costosos de implementar" }
    ],
    correctAnswers: ["c"],
    explanation: "En la planificación del Sprint, el equipo define el Sprint Goal y proyecta (forecast) qué elementos cree que podrá finalizar. Los Desarrolladores organizan el trabajo necesario, planificando al menos los primeros días del Sprint."
  },
  {
    id: 31,
    text: "¿Cuál es el resultado de la reunión de Sprint Planning?",
    options: [
      { key: "a", text: "Cada tarea debe tener un Desarrollador asignado" },
      { key: "b", text: "Cada tarea debe estar estimada, en horas o puntos de historia" },
      { key: "c", text: "Un plan para que los Desarrolladores entreguen un Incremento de Producto" },
      { key: "d", text: "Un Sprint Backlog cerrado que incluye todo el trabajo a completar durante el Sprint para entregar un Incremento de Producto" },
      { key: "e", text: "Un plan para el Sprint creado por el Product Owner" }
    ],
    correctAnswers: ["c"],
    explanation: "El resultado de la planificación es el Sprint Backlog, el cual se compone del Sprint Goal, los elementos seleccionados del Product Backlog y un plan detallado de ejecución (tareas) elaborado por los Desarrolladores."
  },
  {
    id: 32,
    text: "Con respecto al Sprint Review:",
    options: [
      { key: "a", text: "Tanto el Scrum Team como los interesados colaboran para inspeccionar los resultados del Sprint y adaptar el Product Backlog si es necesario" },
      { key: "b", text: "Los interesados pueden rechazar el Incremento e instruir al Product Owner para que reordene el Product Backlog en consecuencia" },
      { key: "c", text: "El Incremento debe ser presentado por el Scrum Master, apoyado por los Desarrolladores, quienes preparan una demostración" },
      { key: "d", text: "Asegura que el Incremento sea validado por expertos del mercado" }
    ],
    correctAnswers: ["a"],
    explanation: "El Sprint Review es un evento colaborativo e informal, no una reunión de aprobación ni entrega formal. El equipo Scrum e interesados analizan el incremento y acuerdan qué hacer a continuación."
  },
  {
    id: 33,
    text: "Durante la reunión de Sprint Planning, los Desarrolladores se dan cuenta de que han seleccionado demasiado trabajo para el Sprint. ¿Qué deberían hacer? (Elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Fingir que no seleccionaron tanto trabajo, para asegurarse de que el Scrum Master no castigue al equipo en su conjunto" },
      { key: "b", text: "Eliminar o cambiar algunos de los elementos del Product Backlog seleccionados para el Sprint" },
      { key: "c", text: "Continuar con el Sprint, pero informando al Product Owner, en caso de que deban negociarse cambios a lo largo del Sprint" },
      { key: "d", text: "Tratar esto como un impedimento que debe ser reportado al Scrum Master" },
      { key: "e", text: "Trabajar horas extras durante el Sprint hasta terminar cada tarea, ya que el trabajo comprometido debe ser entregado" },
      { key: "f", text: "Reprogramar el Sprint Planning, ya que se necesita más aclaración" }
    ],
    correctAnswers: ["b", "c"],
    explanation: "Si hay demasiado trabajo proyectado en la planificación, los Desarrolladores deben sentarse con el Product Owner para priorizar, ajustar o remover elementos del Product Backlog de mutuo acuerdo sin poner en peligro el Sprint Goal."
  },
  {
    id: 34,
    text: "¿Cuáles de los siguientes son eventos con tiempo limitado (time-boxed) como parte del marco de trabajo Scrum? Elige las tres mejores respuestas:",
    options: [
      { key: "a", text: "La reunión de Planificación de Lanzamiento (Release Planning)" },
      { key: "b", text: "La reunión del Daily Scrum" },
      { key: "c", text: "La reunión de Planificación Ágil Diaria" },
      { key: "d", text: "La reunión de Sprint Retrospective" },
      { key: "e", text: "La reunión de Sprint Review" },
      { key: "f", text: "La reunión de Pruebas del Sprint" },
      { key: "g", text: "La reunión de Demostración del Sprint" },
      { key: "h", text: "El Daily Stand-up" }
    ],
    correctAnswers: ["b", "d", "e"],
    explanation: "Scrum tiene definidos tiempos máximos obligatorios (time-boxes) para sus eventos con el fin de fomentar el enfoque: Daily Scrum (15 min), Sprint Review (máx. 4 horas para un Sprint de 1 mes) y Sprint Retrospective (máx. 3 horas)."
  },
  {
    id: 35,
    text: "¿Qué temas no deberían discutirse en una Retrospectiva del Sprint? (Elige las tres mejores respuestas):",
    options: [
      { key: "a", text: "El orden de los elementos del Product Backlog" },
      { key: "b", text: "Mejoras en la forma en que trabaja el equipo" },
      { key: "c", text: "La definición de Terminado (Done)" },
      { key: "d", text: "Relaciones y dinámicas entre los miembros del equipo" },
      { key: "e", text: "Feedback del producto proporcionado por los clientes" },
      { key: "f", text: "Las herramientas y la documentación que el equipo debería implementar" },
      { key: "g", text: "Las historias de usuario que se van a seleccionar para el próximo Sprint" }
    ],
    correctAnswers: ["a", "e", "g"],
    explanation: "La Retrospectiva se centra en el proceso interno, las relaciones humanas y las herramientas. El orden de los elementos, el feedback comercial detallado y la preselección de tareas pertenecen al refinamiento, Sprint Review y Sprint Planning."
  },
  {
    id: 36,
    text: "¿Qué elementos deberían considerarse al decidir la duración del Sprint? (Elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "El nivel de riesgo asociado con la tecnología" },
      { key: "b", text: "La necesidad de obtener feedback frecuente de los interesados y del mercado" },
      { key: "c", text: "Cómo se hacen las cosas dentro de la organización" },
      { key: "d", text: "Con qué frecuencia los miembros del equipo se mueven de un proyecto a otro" },
      { key: "e", text: "El orden del Product Backlog" }
    ],
    correctAnswers: ["a", "b"],
    explanation: "Sprints cortos (menores a 1 mes) reducen el riesgo financiero y tecnológico a un ciclo manejable, y permiten obtener feedback constante del mercado e interesados para adaptar rápidamente el rumbo del producto."
  },
  {
    id: 37,
    text: "El Sprint Backlog incluye:",
    options: [
      { key: "a", text: "Bugs (errores)" },
      { key: "b", text: "Historias de usuario" },
      { key: "c", text: "Pruebas (tests)" },
      { key: "d", text: "Casos de uso" },
      { key: "e", text: "Tareas de desarrollo" },
      { key: "f", text: "Cualquiera de las anteriores" },
      { key: "g", text: "Cualquiera de los elementos mencionados de la a) a la e), excepto c) Pruebas" }
    ],
    correctAnswers: ["f"],
    explanation: "El Sprint Backlog es un plan detallado de los Desarrolladores que puede contener historias de usuario, tareas técnicas, diseño de arquitectura, pruebas, bugs de calidad u otros elementos que sirvan para cumplir con el Sprint Goal."
  },
  {
    id: 38,
    text: "Aplicando los principios de Scrum, ¿cómo dividirías a un grupo de 50 Desarrolladores en varios Scrum Teams?",
    options: [
      { key: "a", text: "El Scrum Master crea los equipos, basándose en la antigüedad y la experiencia" },
      { key: "b", text: "Los Desarrolladores forman los diferentes equipos ellos mismos, teniendo en cuenta el producto y el marco de trabajo Scrum" },
      { key: "c", text: "El Gerente de TI divide al grupo en equipos, basándose en su experiencia" },
      { key: "d", text: "El Scrum Master crea los equipos, trabajando en colaboración con el departamento de recursos humanos" }
    ],
    correctAnswers: ["b"],
    explanation: "La autogestión es un principio de Scrum. Los propios desarrolladores, guiados por el entendimiento del negocio y del producto, son los más capacitados para distribuirse en equipos multifuncionales óptimos."
  },
  {
    id: 39,
    text: "Varios Scrum Teams trabajan en el mismo producto:",
    options: [
      { key: "a", text: "Integrarán su trabajo durante un Sprint de integración" },
      { key: "b", text: "Solo los Desarrolladores senior de cada Scrum Team deberían realizar tareas de integración" },
      { key: "c", text: "Los Incrementos que producen deben estar todos integrados en cada Sprint, para proporcionar transparencia y permitir al Product Owner y a los interesados inspeccionar el resultado" },
      { key: "d", text: "Solo deben integrar su trabajo si existen dependencias" },
      { key: "e", text: "Sus Scrum Masters deberían coordinarse en la reunión de gestión de Scrum Masters" }
    ],
    correctAnswers: ["c"],
    explanation: "Si hay múltiples equipos en un mismo producto, todos deben integrar su trabajo en cada Sprint para que al final del mismo exista un único incremento de producto integrado, usable y transparente."
  },
  {
    id: 40,
    text: "¿Cómo trabajan los Desarrolladores con los requerimientos no funcionales que afectan al Incremento del producto?",
    options: [
      { key: "a", text: "Los ignoran, no deberían formar parte del Product Backlog, el cual solo debe contener historias de usuario" },
      { key: "b", text: "Deben ser abordados por el Desarrollador más experimentado" },
      { key: "c", text: "Se aseguran de que se cumplan en cada Incremento" },
      { key: "d", text: "El equipo de integración del Sprint es responsable de ellos" },
      { key: "e", text: "Deben formularse como Criterios de Aceptación" }
    ],
    correctAnswers: ["c"],
    explanation: "Los requisitos no funcionales (rendimiento, seguridad, estabilidad) se incorporan en la Definición de Terminado (DoD) para garantizar que todo incremento completado cumpla con estos criterios de calidad indispensables."
  },
  {
    id: 41,
    text: "¿Quién debería tener más conocimiento sobre los objetivos de negocio y la planificación de lanzamientos (releases)?",
    options: [
      { key: "a", text: "El Director de Proyecto (Project Manager)" },
      { key: "b", text: "El Scrum Master" },
      { key: "c", text: "El Scrum Manager" },
      { key: "d", text: "Los Desarrolladores" },
      { key: "e", text: "El Product Owner" }
    ],
    correctAnswers: ["e"],
    explanation: "El Product Owner es responsable de alinear el valor comercial, establecer los objetivos de negocio del producto y coordinar las estrategias de lanzamiento basándose en el presupuesto y la dirección de la empresa."
  },
  {
    id: 42,
    text: "Los Desarrolladores se han dado cuenta de que seleccionaron demasiado trabajo y de que no podrán entregar toda la proyección. ¿Quiénes deberían discutir cómo ajustar el trabajo del Sprint sin comprometer el objetivo del Sprint (Sprint Goal)?",
    options: [
      { key: "a", text: "El Scrum Master y los Desarrolladores" },
      { key: "b", text: "Los interesados (stakeholders) y los Desarrolladores" },
      { key: "c", text: "El desarrollador líder y el Scrum Master" },
      { key: "d", text: "El Product Owner y los Desarrolladores" },
      { key: "e", text: "El equipo de gerencia y los Desarrolladores" },
      { key: "f", text: "No hay necesidad de discusión, los Desarrolladores ya se comprometieron con el trabajo" }
    ],
    correctAnswers: ["d"],
    explanation: "El Sprint Backlog es gestionado por los Desarrolladores, pero si surge la necesidad de cambiar o recortar alcance, deben hablar directamente con el Product Owner para acordar cambios respetando siempre el Sprint Goal."
  },
  {
    id: 43,
    text: "¿Quién define lo que significa \"Terminado\" (Done)?",
    options: [
      { key: "a", text: "El Product Owner, como maximizador de valor del producto" },
      { key: "b", text: "La organización de desarrollo, o alternativamente el Scrum Team" },
      { key: "c", text: "El Scrum Team en su conjunto, sumando todas las definiciones sugeridas por sus miembros" },
      { key: "d", text: "El equipo del Product Owner" },
      { key: "e", text: "El Scrum Master, de una manera que maximice la productividad y el ánimo del equipo" }
    ],
    correctAnswers: ["b"],
    explanation: "Si la organización de desarrollo ya tiene definida una norma de Terminado (DoD), el equipo Scrum la adopta por defecto. Si la empresa no cuenta con ella, el Scrum Team debe consensuar una Definición de Terminado apta para el producto."
  },
  {
    id: 44,
    text: "Los Desarrolladores han determinado que las Retrospectivas del Sprint son inútiles y han decidido dejarlas de hacer.",
    options: [
      { key: "a", text: "El Scrum Master debería comenzar a facilitar Retrospectivas del Sprint útiles, mostrando su valor al equipo" },
      { key: "b", text: "El Scrum Master debería reportar el problema a su gerente directo, ya que esto es un impedimento para Scrum como marco de trabajo" },
      { key: "c", text: "El Scrum Master debería aceptar la decisión de los Desarrolladores, dado que el Scrum Team es autogestionado y multifuncional" },
      { key: "d", text: "El Scrum Master debería reportar el problema al Product Owner y solicitar su consejo" },
      { key: "e", text: "El Scrum Master podría decidir cancelar el próximo Sprint como consecuencia, hasta que la situación se resuelva" }
    ],
    correctAnswers: ["a"],
    explanation: "Como facilitador del marco, el Scrum Master debe guiar al equipo a entender que la Retrospectiva es el principal motor de mejora continua. Debe actuar diseñando retrospectivas dinámicas y valiosas para resolver este impedimento."
  },
  {
    id: 45,
    text: "Un Incremento debe liberarse a producción al final de cada Sprint como una forma de validar la funcionalidad del producto:",
    options: [
      { key: "a", text: "Verdadero" },
      { key: "b", text: "Falso" }
    ],
    correctAnswers: ["b"],
    explanation: "El Incremento debe estar en estado 'Terminado' (Done) y ser técnicamente almacenable y desplegable, pero no es obligatorio subirlo a producción al final de cada Sprint. Esa es una decisión comercial del Product Owner."
  },
  {
    id: 46,
    text: "El Product Owner debe estar presente en el Daily Scrum:",
    options: [
      { key: "a", text: "Verdadero" },
      { key: "b", text: "Falso" }
    ],
    correctAnswers: ["b"],
    explanation: "El Daily Scrum es un evento de uso exclusivo para los Desarrolladores. El Product Owner no tiene la obligación de asistir a menos que también participe activamente programando tareas."
  },
  {
    id: 47,
    text: "¿Qué técnicas podrían ayudar al Scrum Master cuando los Desarrolladores no están de acuerdo sobre qué herramientas utilizar? (Elige las dos mejores respuestas):",
    options: [
      { key: "a", text: "Hablar con el gerente directo de cada Desarrollador" },
      { key: "b", text: "Pedir al Product Owner que explique la visión" },
      { key: "c", text: "Involucrar a todos los Desarrolladores para encontrar una solución" },
      { key: "d", text: "Hacer coaching a los Desarrolladores, por ejemplo, haciendo preguntas apropiadas o escuchando activamente" }
    ],
    correctAnswers: ["c", "d"],
    explanation: "El Scrum Master actúa como líder servicial y facilitador. No debe imponer soluciones técnicas, sino guiar al equipo mediante técnicas de coaching y dinámicas grupales para que el equipo llegue a su propio consenso técnico."
  },
  {
    id: 48,
    text: "¿Cuándo es el mejor momento para que el equipo actualice la definición de \"Terminado\" (Done) si es necesario?",
    options: [
      { key: "a", text: "En el Sprint Planning" },
      { key: "b", text: "En la Retrospectiva del Sprint (Sprint Retrospective)" },
      { key: "c", text: "En el Sprint Review" },
      { key: "d", text: "Antes de que comience el nuevo Sprint" },
      { key: "e", text: "Durante el Daily Stand-up" }
    ],
    correctAnswers: ["b"],
    explanation: "La Retrospectiva del Sprint es el evento dedicado a inspeccionar las metodologías y la calidad del trabajo del Scrum Team. Por ende, es el momento idóneo para revisar y mejorar la Definición de Terminado."
  },
  {
    id: 49,
    text: "En relación con la arquitectura y la infraestructura de una aplicación de software, elige las dos mejores respuestas:",
    options: [
      { key: "a", text: "Se implementan a medida que los Desarrolladores también implementan los elementos funcionales del Backlog, como las historias de usuario" },
      { key: "b", text: "Se trabaja en ellas en los primeros Sprints, mientras que también se entrega algo de funcionalidad de negocio" },
      { key: "c", text: "Se definen por completo antes del primer Sprint" },
      { key: "d", text: "Son creadas y mantenidas por el equipo de infraestructura" },
      { key: "e", text: "Deberían abordarse únicamente hacia el final del proyecto" }
    ],
    correctAnswers: ["a", "b"],
    explanation: "En Scrum, la infraestructura y arquitectura no se definen al 100% de manera inicial. Se construyen de forma evolutiva e iterativa durante los primeros Sprints a la par que se entrega valor de negocio real e inspeccionable."
  },
  {
    id: 50,
    text: "¿Qué indica un gráfico de avance de lanzamiento (release burndown chart)?",
    options: [
      { key: "a", text: "La fecha exacta en que terminará el proyecto" },
      { key: "b", text: "Cuándo es probable que se termine el trabajo restante" },
      { key: "c", text: "La ganancia y pérdida acumulada del proyecto" },
      { key: "d", text: "El tiempo y esfuerzo invertidos por los Desarrolladores, que debe medirse en puntos de historia" }
    ],
    correctAnswers: ["b"],
    explanation: "El gráfico de burndown de lanzamiento mide la tendencia de los puntos de historia o volumen de trabajo que resta en el Product Backlog. Permite estimar cuándo se completará probabilísticamente el alcance proyectado."
  }
];

export default function PruebasMPage() {
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [confirmed, setConfirmed] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "correct" | "incorrect">("all");
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(questions);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const currentQuestion = activeQuestions[currentIdx];
  const totalQuestions = activeQuestions.length;
  const isMulti = currentQuestion ? currentQuestion.correctAnswers.length > 1 : false;
  const isCurrentConfirmed = currentQuestion ? !!confirmed[currentQuestion.id] : false;

  const handleSelectOption = (qId: number, key: string) => {
    if (isCurrentConfirmed) return; // Prevent selection changes after confirmation

    setAnswers((prev) => {
      const currentSelected = prev[qId] || [];
      if (isMulti) {
        if (currentSelected.includes(key)) {
          return { ...prev, [qId]: currentSelected.filter((k) => k !== key) };
        } else {
          const limit = currentQuestion.correctAnswers.length;
          if (currentSelected.length >= limit) {
            return { ...prev, [qId]: [...currentSelected.slice(1), key] };
          }
          return { ...prev, [qId]: [...currentSelected, key] };
        }
      } else {
        // For single select, auto-confirm once selected
        const updated = { ...prev, [qId]: [key] };
        setConfirmed(c => ({ ...c, [qId]: true }));
        return updated;
      }
    });
  };

  const handleConfirmMulti = () => {
    if (!isCurrentConfirmed) {
      setConfirmed(prev => ({ ...prev, [currentQuestion.id]: true }));
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setConfirmed({});
    setCurrentIdx(0);
    setFinished(false);
    setStarted(false);
    setActiveQuestions(questions);
    setIsReviewMode(false);
  };

  const retryIncorrect = () => {
    // Filter questions that were answered incorrectly in the current active session
    const incorrect = activeQuestions.filter((q) => {
      const userAns = answers[q.id] || [];
      const correct = q.correctAnswers;
      const isCorrect = userAns.length === correct.length && correct.every((c) => userAns.includes(c));
      return !isCorrect;
    });

    if (incorrect.length > 0) {
      // Clear answers and confirmed status only for these incorrect questions
      setAnswers((prev) => {
        const copy = { ...prev };
        incorrect.forEach((q) => {
          delete copy[q.id];
        });
        return copy;
      });
      setConfirmed((prev) => {
        const copy = { ...prev };
        incorrect.forEach((q) => {
          delete copy[q.id];
        });
        return copy;
      });

      setActiveQuestions(incorrect);
      setCurrentIdx(0);
      setFinished(false);
      setStarted(true);
      setIsReviewMode(true);
    }
  };

  // Evaluate scorecard
  let score = 0;
  activeQuestions.forEach((q) => {
    const userAns = answers[q.id] || [];
    const correct = q.correctAnswers;
    if (userAns.length === correct.length && correct.every((c) => userAns.includes(c))) {
      score += 1;
    }
  });

  const percent = Math.round((score / totalQuestions) * 100);
  const passed = percent >= 85;

  const getFilteredQuestions = () => {
    return activeQuestions.filter((q) => {
      const userAns = answers[q.id] || [];
      const correct = q.correctAnswers;
      const isCorrect = userAns.length === correct.length && correct.every((c) => userAns.includes(c));

      if (filterType === "correct") return isCorrect;
      if (filterType === "incorrect") return !isCorrect;
      return true;
    });
  };

  const activeUserSelections = answers[currentQuestion?.id] || [];
  const activeCorrect = currentQuestion?.correctAnswers || [];
  const isActiveCorrect = activeUserSelections.length === activeCorrect.length && activeCorrect.every((c) => activeUserSelections.includes(c));

  if (!started) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-16 px-6 font-sans relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />

        <div className="max-w-xl w-full text-center relative z-10 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-[32px] shadow-2xl">
          <div className="w-20 h-20 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-8 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            🎓
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Prueba de Certificación <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Scrum Master (PSM I)</span>
          </h1>
          <p className="text-slate-400 font-medium text-base mb-8 leading-relaxed">
            Pon a prueba tus conocimientos con este simulador interactivo de 50 preguntas. Ahora con retroalimentación y explicaciones inmediatas.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10 text-left bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60">
            <div>
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Preguntas</div>
              <div className="text-xl font-bold text-white mt-1">50</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Modo</div>
              <div className="text-sm font-bold text-indigo-400 mt-1">Feedback Activo</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Aprobación</div>
              <div className="text-xl font-bold text-white mt-1">85%</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setActiveQuestions(questions);
                setStarted(true);
              }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
            >
              🚀 Comenzar Prueba
            </button>
            <Link
              href="/automatizacion-rrss/panel"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700/50 transition-all flex items-center justify-center"
            >
              Volver al Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const incorrectCount = totalQuestions - score;

    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-16 px-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto relative z-10">
          
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-[32px] shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 ${passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {passed ? "🏆 Aprobado" : "❌ No Aprobado"}
              </span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                {isReviewMode ? "Revisión del Repaso" : "Resultado de la Prueba"}
              </h1>
              <p className="text-slate-400 mt-2 font-medium">
                {isReviewMode 
                  ? `Has corregido y contestado bien ${score} de ${totalQuestions} preguntas erróneas.` 
                  : `Has contestado correctamente ${score} de ${totalQuestions} preguntas.`}
              </p>
            </div>

            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="64" className="stroke-slate-800" strokeWidth="10" fill="transparent" />
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className={passed ? "stroke-emerald-500" : "stroke-indigo-500"}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * percent) / 100}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-white">{percent}%</span>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Puntaje</div>
              </div>
            </div>
          </div>

          {/* Action Choice Panel */}
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between mb-12 bg-slate-900/40 p-6 md:p-8 rounded-[24px] border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">¿Qué quieres hacer ahora?</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">Puedes reintentar responder las preguntas en las que fallaste o empezar un test de 50 preguntas desde cero.</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              {incorrectCount > 0 && (
                <button
                  onClick={retryIncorrect}
                  className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5"
                >
                  🔄 Volver a responder las erróneas ({incorrectCount})
                </button>
              )}
              <button
                onClick={resetQuiz}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1"
              >
                📝 Iniciar test completo
              </button>
              <Link
                href="/automatizacion-rrss/panel"
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700/50 text-xs transition-all flex items-center justify-center"
              >
                Salir
              </Link>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === "all" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-slate-200"}`}
            >
              Todas ({totalQuestions})
            </button>
            <button
              onClick={() => setFilterType("correct")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === "correct" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200"}`}
            >
              Correctas ({score})
            </button>
            <button
              onClick={() => setFilterType("incorrect")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === "incorrect" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "text-slate-400 hover:text-slate-200"}`}
            >
              Incorrectas ({incorrectCount})
            </button>
          </div>

          <div className="space-y-6">
            {getFilteredQuestions().map((q) => {
              const userAns = answers[q.id] || [];
              const correct = q.correctAnswers;
              const isCorrect = userAns.length === correct.length && correct.every((c) => userAns.includes(c));

              return (
                <div key={q.id} className="bg-slate-900/30 border border-slate-800/80 p-6 md:p-8 rounded-2xl relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="text-indigo-400 text-xs font-bold">Pregunta {q.id}</span>
                      <h3 className="text-lg font-bold text-white mt-1 leading-snug">{q.text}</h3>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {isCorrect ? "✓ Correcta" : "✗ Incorrecta"}
                    </span>
                  </div>

                  <div className="space-y-3 mt-6">
                    {q.options.map((opt) => {
                      const isSelected = userAns.includes(opt.key);
                      const isOptCorrect = correct.includes(opt.key);

                      let cardStyle = "border-slate-800 bg-slate-950/20 text-slate-400";
                      let badge = null;

                      if (isOptCorrect) {
                        cardStyle = "border-emerald-500/50 bg-emerald-950/10 text-emerald-200";
                        badge = <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Respuesta Correcta</span>;
                      } else if (isSelected && !isOptCorrect) {
                        cardStyle = "border-rose-500/50 bg-rose-950/10 text-rose-200";
                        badge = <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest shrink-0 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Tu selección</span>;
                      }

                      return (
                        <div key={opt.key} className={`flex items-start justify-between gap-4 p-4 rounded-xl border text-sm font-medium transition-all ${cardStyle}`}>
                          <div className="flex gap-3">
                            <span className="font-bold opacity-60 uppercase">{opt.key})</span>
                            <span>{opt.text}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      💡 Explicación:
                    </h4>
                    <p className="text-sm text-indigo-200 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-12 px-6 font-sans relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/15 rounded-full blur-[120px]" />

      <div className="max-w-3xl w-full relative z-10">
        
        {/* Progress header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              {isReviewMode ? "Repasando Errónea" : "Pregunta"} {currentIdx + 1} de {totalQuestions}
            </span>
            {isReviewMode && (
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                Modo Repaso 🔄
              </span>
            )}
            {isMulti && (
              <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                Selecciona {currentQuestion.correctAnswers.length} opciones
              </span>
            )}
          </div>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {Math.round(((currentIdx + 1) / totalQuestions) * 100)}% Completado
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-850 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Panel */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-[32px] shadow-2xl min-h-[420px] flex flex-col justify-between transition-all">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug mb-8">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const isSelected = activeUserSelections.includes(opt.key);
                const isCorrectOption = activeCorrect.includes(opt.key);

                let optStyle = "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200";
                let badge = null;

                if (isCurrentConfirmed) {
                  if (isCorrectOption) {
                    optStyle = "bg-emerald-950/15 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-500/5";
                    badge = <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">✓ Correcta</span>;
                  } else if (isSelected) {
                    optStyle = "bg-rose-950/15 border-rose-500/60 text-rose-200 shadow-md";
                    badge = <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0">✗ Tu elección</span>;
                  } else {
                    optStyle = "bg-slate-950/10 border-slate-900 text-slate-600 opacity-60";
                  }
                } else if (isSelected) {
                  optStyle = "bg-indigo-600/10 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/5";
                }

                return (
                  <button
                    key={opt.key}
                    disabled={isCurrentConfirmed}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.key)}
                    className={`w-full text-left flex items-start justify-between gap-4 p-5 rounded-2xl border text-sm font-semibold transition-all group ${optStyle}`}
                  >
                    <div className="flex gap-4 items-start">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border uppercase shrink-0 transition-all ${
                          isSelected
                            ? isCurrentConfirmed 
                              ? isCorrectOption ? "bg-emerald-600 border-emerald-400 text-white" : "bg-rose-600 border-rose-400 text-white"
                              : "bg-indigo-600 border-indigo-400 text-white"
                            : isCurrentConfirmed && isCorrectOption 
                              ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                              : "border-slate-800 text-slate-500 group-hover:border-slate-600 group-hover:text-slate-400"
                        }`}
                      >
                        {isMulti ? (isSelected ? "✓" : "") : opt.key}
                      </span>
                      <span className="leading-normal">{opt.text}</span>
                    </div>
                    {badge}
                  </button>
                );
              })}
            </div>

            {/* Slide down feedback & explanation */}
            {isCurrentConfirmed && (
              <div className="mt-8 p-6 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{isActiveCorrect ? "🎉" : "💡"}</span>
                  <h4 className={`text-sm font-black uppercase tracking-wider ${isActiveCorrect ? "text-emerald-400" : "text-indigo-400"}`}>
                    {isActiveCorrect ? "¡Respuesta Correcta!" : "Respuesta Incorrecta"}
                  </h4>
                </div>
                <p className="text-sm text-indigo-200 leading-relaxed font-medium">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-8 mt-10">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-6 py-3 bg-slate-850 hover:bg-slate-800 disabled:bg-slate-900/40 disabled:border-transparent disabled:text-slate-700 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all"
            >
              ← Anterior
            </button>

            {isMulti && !isCurrentConfirmed ? (
              <button
                onClick={handleConfirmMulti}
                disabled={activeUserSelections.length === 0}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/10 transition-all"
              >
                Confirmar Selección
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isCurrentConfirmed}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/10 transition-all"
              >
                {currentIdx === totalQuestions - 1 ? "Ver Resultados" : "Siguiente →"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

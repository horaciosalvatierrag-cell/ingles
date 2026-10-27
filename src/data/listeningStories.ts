export interface ListeningQuestion {
  prompt: string;
  options: string[];
  answer: number;
}

export interface ListeningStory {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  title: string;
  summary: string;
  paragraphs: string[];
  questions: ListeningQuestion[];
}

export const listeningStories: ListeningStory[] = [
  {
    id: 'morning', level: 'A1', title: 'A New Morning', summary: 'Una mañana sencilla en la vida de Ana.',
    paragraphs: [
      'Ana lives in a small apartment near a park. Every morning, she wakes up at seven o’clock. She opens the window and looks at the sky. Today the sun is bright, and the birds are singing. Ana smiles because she has an important day ahead.',
      'She makes a cup of tea and eats bread with fruit. Then she checks her bag. Her keys, phone, and notebook are inside. Ana walks to the bus stop. She sees her neighbor, Mr. Lee, and says good morning. They talk about the weather while they wait.',
      'At work, Ana meets a new colleague named Sam. She shows him where to find coffee and explains the office schedule. At lunch, they eat outside in the park. Sam says he is happy to be there. Ana tells him that the first day is always easier with a friendly face.',
      'After work, Ana buys vegetables at a small market. She cooks dinner, calls her sister, and tells her about Sam. Before bed, she puts her clothes out for tomorrow. It was a busy day, but Ana feels calm and proud.'
    ],
    questions: [
      { prompt: 'What time does Ana wake up?', options: ['At six', 'At seven', 'At eight'], answer: 1 },
      { prompt: 'How does Ana travel to work?', options: ['By bus', 'By train', 'By car'], answer: 0 },
      { prompt: 'Who is Sam?', options: ['Her neighbor', 'Her brother', 'A new colleague'], answer: 2 },
      { prompt: 'How does Ana feel at the end of the day?', options: ['Calm and proud', 'Angry and tired', 'Surprised and worried'], answer: 0 }
    ]
  },
  {
    id: 'market', level: 'A2', title: 'The Saturday Market', summary: 'Maya descubre un mercado local y sus sabores.',
    paragraphs: [
      'Maya moved to a new neighborhood two weeks ago. On Saturday morning, she follows the sound of music to the main square. A farmers’ market is open there. Stalls are full of apples, peppers, bread, flowers, and jars of honey. A musician plays guitar beside the fountain.',
      'Maya wants to make soup, so she asks a farmer which vegetables are in season. He recommends carrots, potatoes, and squash. He gives her a small piece of squash to taste. It is sweet and soft. Maya buys enough for dinner and asks for a recipe. The farmer explains how his family makes it with beans and herbs.',
      'At the next stall, Maya meets Rosa, who sells handmade pottery. They discover that they both enjoy hiking. Rosa tells her about a walking group that meets every Sunday. Maya writes down the meeting place and promises to come next week.',
      'At home, Maya cooks the soup and sends a photo to her mother. The recipe is easy, but the flavor is rich. She has groceries for the week, a new walking plan, and a reason to look forward to Sunday. The neighborhood feels less unfamiliar now.'
    ],
    questions: [
      { prompt: 'Why does Maya go to the market?', options: ['To buy a new guitar', 'To find vegetables for soup', 'To meet her mother'], answer: 1 },
      { prompt: 'What does the farmer recommend?', options: ['Carrots, potatoes, and squash', 'Apples and flowers', 'Bread and honey'], answer: 0 },
      { prompt: 'What do Maya and Rosa both enjoy?', options: ['Cooking classes', 'Painting', 'Hiking'], answer: 2 },
      { prompt: 'When does the walking group meet?', options: ['Every Saturday', 'Every Sunday', 'Every Friday'], answer: 1 }
    ]
  },
  {
    id: 'train', level: 'B1', title: 'The Last Train Home', summary: 'Un retraso inesperado convierte una noche difícil en una amistad.',
    paragraphs: [
      'When Daniel arrived at the station, the departure board showed that his train was delayed by forty minutes. He had planned to reach his hometown before dinner, and he was already tired from a long week. He found a seat beside a woman who was reading a book about local history.',
      'Her name was Evelyn. She had been visiting her daughter in the city and was now returning to the village where she had grown up. As they talked, Daniel mentioned that he was writing a short article about the old railway. Evelyn laughed and said that her grandfather had worked on the line for nearly thirty years.',
      'She described a tiny station that had closed before Daniel was born. Her grandfather used to keep a notebook of unusual passengers and small acts of kindness. Evelyn still had one of his notebooks at home. Daniel asked if he might see it, and she offered to show him when he visited the village library.',
      'The announcement finally came: the train would leave in ten minutes. Daniel realized that he had forgotten to eat, so Evelyn shared an apple from her bag. The delay had seemed like a problem, but it gave Daniel a valuable lead for his article and a new reason to return to the village.'
    ],
    questions: [
      { prompt: 'Why is Daniel travelling?', options: ['To visit his hometown', 'To start a new job', 'To meet his grandfather'], answer: 0 },
      { prompt: 'What is Daniel writing about?', options: ['A city restaurant', 'The old railway', 'A family recipe'], answer: 1 },
      { prompt: 'What did Evelyn’s grandfather collect?', options: ['Old tickets', 'Train photographs', 'Stories in a notebook'], answer: 2 },
      { prompt: 'How did the delay help Daniel?', options: ['He found a source for his article', 'He got a free ticket', 'He avoided a long walk'], answer: 0 }
    ]
  },
  {
    id: 'garden', level: 'B2', title: 'A Garden Above the City', summary: 'Vecinos transforman una azotea olvidada en un espacio comunitario.',
    paragraphs: [
      'For years, the roof of the Bell Street apartment building was an empty stretch of concrete. The residents rarely went upstairs, except to check the water tank. When the city announced a small grant for neighborhood projects, Leila suggested turning the roof into a garden. She expected polite interest; instead, twelve residents volunteered before the meeting ended.',
      'The first obstacle was structural. A local engineer checked the roof and explained how much weight it could safely hold. The group abandoned their idea of large wooden beds and chose lightweight containers instead. They collected rainwater in barrels, installed a simple drip system, and selected herbs and vegetables that could tolerate strong wind.',
      'Not everyone agreed about how the garden should be used. Some wanted quiet seating, while others hoped to host weekend events. The residents decided on shared hours: early mornings would remain peaceful, and one afternoon each month could be reserved for a community meal. They also created a rota so that caring for the plants would not fall to one person.',
      'By late summer, the roof smelled of mint and warm tomatoes. More surprising than the harvest was the change in the building. Neighbors who had lived there for years finally learned each other’s names. A small grant had paid for soil and tools, but the real resource was the time residents were willing to share.'
    ],
    questions: [
      { prompt: 'What forced the group to change their original garden design?', options: ['The roof could not support heavy structures', 'The grant was cancelled', 'The residents disliked vegetables'], answer: 0 },
      { prompt: 'How did they address disagreements about the space?', options: ['They divided the roof into private lots', 'They created shared hours for different uses', 'They let Leila make every decision'], answer: 1 },
      { prompt: 'What did the residents consider the project’s most valuable resource?', options: ['The rainwater system', 'The grant money', 'The time neighbors shared'], answer: 2 },
      { prompt: 'What changed in the building besides the roof?', options: ['Residents began to know one another', 'Everyone moved to a new building', 'The city hired a gardener'], answer: 0 }
    ]
  },
  {
    id: 'archive', level: 'C1', title: 'The Archive of Unsent Letters', summary: 'Una archivista investiga una caja de cartas que nunca llegaron a su destino.',
    paragraphs: [
      'When archivist Nia Okafor opened the cedar box, she expected to find routine correspondence from the early twentieth century. Instead, she found fifty-three letters, each addressed but none stamped or posted. Their author, a railway clerk named Thomas Vale, had written to people he could no longer reach: a sister who had emigrated, a friend who had died, and a partner whose name appeared only as “E.”',
      'The letters were not arranged by date. Nia noticed that Thomas had revised several passages in different inks, as though he had returned to them over many years. One described a flood that destroyed the family farm; another referred to a strike at the depot. By matching these details with newspapers and employment records, Nia reconstructed a timeline that differed sharply from the family history preserved in a local museum.',
      'The museum had presented Thomas as a loyal employee who remained in the town out of duty. The letters suggested a more complicated choice. He had been offered work elsewhere, but he stayed because his sister had asked him to protect their mother’s house. In a later letter, he questioned whether that promise had become an excuse for avoiding change. The private record did not invalidate the public account; it revealed the uncertainty the official narrative had smoothed over.',
      'Nia faced an ethical question: the letters exposed painful details about living relatives. She contacted the family, explained what she had found, and proposed a public exhibit that would include only passages they approved. One descendant asked that a letter remain sealed. Nia agreed. Preserving a document, she concluded, did not mean claiming ownership of every story it contained.'
    ],
    questions: [
      { prompt: 'Why were the letters historically valuable?', options: ['They revealed a timeline that challenged the museum’s simple account', 'They proved Thomas was the town’s first railway owner', 'They contained official government orders'], answer: 0 },
      { prompt: 'Why might Thomas have remained in town?', options: ['He was unable to find any other work', 'He had promised his sister to protect their mother’s house', 'The railway prohibited him from leaving'], answer: 1 },
      { prompt: 'What ethical choice did Nia make?', options: ['She destroyed the letters', 'She published every page immediately', 'She consulted the family and respected a request to keep one letter sealed'], answer: 2 },
      { prompt: 'What is the central idea of the story?', options: ['Historical preservation also requires care for the people in a record', 'Archives should contain only official documents', 'Family stories are always more accurate than public history'], answer: 0 }
    ]
  }
];

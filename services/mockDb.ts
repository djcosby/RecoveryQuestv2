import { Course, LibraryResource, User, Unit, EfficacyMetric } from '../types';

// --- MOCK DATA ---

const MOCK_USER: User = {
  id: 'u-123',
  name: 'Alex Recovery',
  email: 'alex@example.com',
  level: 3,
  xp: 450,
  streakDays: 12,
  lastLogin: new Date().toISOString(),
  completedUnitIds: ['unit-101'],
  subscriptionTier: 'free'
};

const MOCK_LIBRARY: LibraryResource[] = [
  {
    id: 'lib-aa-bb-1',
    title: 'The Big Book',
    author: 'Alcoholics Anonymous',
    type: 'book',
    tags: ['addiction', 'steps', 'stories'],
    content: `
      Story: Bill's Story. 
      War fever ran high in the New England town to which we new, young officers from Plattsburg were assigned, 
      and we felt flattered when the first citizens took us to their homes and made much of us. 
      I had found the least bit of liquor more than effective to talk. 
      ...
      I was to know the whole gamut of hard drinkers. 
      The essence of all growth is a willingness to change for the better and then an unremitting willingness to shoulder whatever responsibility this entails.
    `
  },
  {
    id: 'lib-na-bt-1',
    title: 'Basic Text',
    author: 'Narcotics Anonymous',
    type: 'book',
    tags: ['addiction', 'narcotics', 'recovery'],
    content: `
      We cannot change the nature of the addict or addiction. 
      We can help to change the old lie "Once an addict, always an addict," by striving to make that a reality. 
      Recovery begins with an addict's surrender.
    `
  }
];

const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Foundations of Recovery',
    description: 'Start here to build your base.',
    units: [
      {
        id: 'unit-101',
        title: 'Admitting Powerlessness',
        description: 'Understanding Step 1.',
        order: 1,
        isLocked: false,
        type: 'learning',
        content: '# Step 1\nWe admitted we were powerless over our addiction - that our lives had become unmanageable.\n\nThis is the foundation of recovery. Without this step, no other step is possible.'
      },
      {
        id: 'unit-102',
        title: 'Quiz: Understanding Denial',
        description: 'Test your knowledge on denial mechanisms.',
        order: 2,
        isLocked: false,
        type: 'quiz',
        libraryRefId: 'lib-aa-bb-1' // RAG source
      },
      {
        id: 'unit-103',
        title: 'Roleplay: Refusing a Drink',
        description: 'Practice saying no in a social setting.',
        order: 3,
        isLocked: true, // Mock locked state
        type: 'roleplay',
        aiPrompt: 'You are an old friend of the user at a wedding. You are insisting they have just one champagne toast. Be persuasive but eventually accepting if they set a firm boundary.'
      }
    ]
  }
];

// --- SILVERBOOK ENGINE (Analytics) ---

const metricsLog: EfficacyMetric[] = [];

export const SilverbookEngine = {
  logInteraction: (metric: EfficacyMetric) => {
    console.log('[Silverbook Engine] Logging Metric:', metric);
    metricsLog.push(metric);
    // In real app, this would be: await supabase.from('analytics').insert(metric);
  },
  
  getMetrics: () => metricsLog
};

// --- DATA ACCESS LAYER ---

export const db = {
  getUser: async (): Promise<User> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));
    return { ...MOCK_USER };
  },

  updateUser: async (updates: Partial<User>): Promise<User> => {
    Object.assign(MOCK_USER, updates);
    return { ...MOCK_USER };
  },

  getCourses: async (): Promise<Course[]> => {
    return MOCK_COURSES;
  },

  getLibraryResource: async (id: string): Promise<LibraryResource | undefined> => {
    return MOCK_LIBRARY.find(r => r.id === id);
  },

  getAllLibraryResources: async (): Promise<LibraryResource[]> => {
    return MOCK_LIBRARY;
  }
};
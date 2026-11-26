import {
  BookOpen, Brain, Circle, CloudRain, Compass, Droplets, Eye, Flower2, Footprints, Heart, ListTree, MessagesSquare,
  Moon, NotebookPen, Repeat, Sparkles, Sprout, Sunrise, Users, Waves, Dumbbell, Coffee, Music, Sun, Leaf, Target,
} from 'lucide-react'

// Explicit registry keeps the bundle tree-shaken (no `import *`).
const REGISTRY = {
  BookOpen, Brain, Circle, CloudRain, Compass, Droplets, Eye, Flower2, Footprints, Heart, ListTree, MessagesSquare,
  Moon, NotebookPen, Repeat, Sparkles, Sprout, Sunrise, Users, Waves, Dumbbell, Coffee, Music, Sun, Leaf, Target,
}
export const ICON_NAMES = Object.keys(REGISTRY).filter((n) => n !== 'Circle')

export function DynamicIcon({ name, ...props }) {
  const Comp = REGISTRY[name] || Circle
  return <Comp {...props} />
}

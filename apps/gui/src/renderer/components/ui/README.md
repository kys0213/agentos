# shadcn/ui Components

This directory contains shadcn/ui style components for the AgentOS GUI application.

## Available Components

### Button (`button.tsx`)
Standard button component with multiple variants and sizes.

```tsx
import { Button } from './ui/button';

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost" size="sm">Small Ghost</Button>
```

### Input (`input.tsx`)
Text input component with focus styling.

```tsx
import { Input } from './ui/input';

<Input placeholder="Enter text..." />
```

### Badge (`badge.tsx`)
Badge/label component for status indicators.

```tsx
import { Badge } from './ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
```

### Card (`card.tsx`)
Card container with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Avatar (`avatar.tsx`)
Avatar component with image and fallback support.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>
```

### Popover (`popover.tsx`)
Popover component for floating content.

```tsx
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent>
    Popover content
  </PopoverContent>
</Popover>
```

## Import All Components

```tsx
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Popover,
  PopoverTrigger,
  PopoverContent
} from './ui';
```

## Styling

Components use Tailwind CSS classes and are compatible with the existing Chakra UI design system. The color palette has been extended to support shadcn/ui semantic colors while maintaining Chakra UI compatibility.
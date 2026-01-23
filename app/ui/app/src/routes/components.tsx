import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

function ComponentsPage() {
  return (
    <div className="min-h-screen bg-dojo-bg-primary p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center mb-12">
          <h1 className="font-brand font-bold text-white mb-4">
            Dojo Genesis Design System
          </h1>
          <p className="text-dojo-text-secondary text-lg">
            Component Gallery - Glassmorphism & Sunset Gradients
          </p>
        </div>

        {/* Button Components */}
        <Card className="p-8">
          <h2 className="font-bold text-white mb-6">Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Primary (Sunset Gradient)
              </h3>
              <div className="flex gap-4 flex-wrap">
                <Button primary>Primary Button</Button>
                <Button primary disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Secondary (Glass)
              </h3>
              <div className="flex gap-4 flex-wrap">
                <Button secondary>Secondary Button</Button>
                <Button secondary disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Ghost (Transparent)
              </h3>
              <div className="flex gap-4 flex-wrap">
                <Button ghost>Ghost Button</Button>
                <Button ghost disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Other Variants
              </h3>
              <div className="flex gap-4 flex-wrap">
                <Button outline>Outline</Button>
                <Button plain>Plain</Button>
                <Button color="blue">Colored</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Input Components */}
        <Card className="p-8">
          <h2 className="font-bold text-white mb-6">Inputs</h2>
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-dojo-text-secondary mb-2">
                Text Input (Glass with Accent Focus)
              </label>
              <Input type="text" placeholder="Type something..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-dojo-text-secondary mb-2">
                Email Input
              </label>
              <Input type="email" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-dojo-text-secondary mb-2">
                Disabled Input
              </label>
              <Input type="text" placeholder="Disabled" disabled />
            </div>
          </div>
        </Card>

        {/* Card Components */}
        <Card className="p-8">
          <h2 className="font-bold text-white mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Basic Card
              </h3>
              <p className="text-dojo-text-secondary">
                A simple card with glassmorphism effect.
              </p>
            </Card>

            <Card hover className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Hover Card
              </h3>
              <p className="text-dojo-text-secondary">
                Hover over me to see the lift effect!
              </p>
            </Card>

            <Card hover className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Avatar initials="DG" size="sm" />
                <span className="text-white font-medium">With Avatar</span>
              </div>
              <p className="text-dojo-text-secondary">
                Cards can contain any content.
              </p>
            </Card>
          </div>
        </Card>

        {/* Badge Components */}
        <Card className="p-8">
          <h2 className="font-bold text-white mb-6">Badges</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Accent Badge (Dojo Genesis)
              </h3>
              <div className="flex gap-3 flex-wrap">
                <Badge color="accent">Featured</Badge>
                <Badge color="accent">New</Badge>
                <Badge color="accent">Hot</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Semantic Colors
              </h3>
              <div className="flex gap-3 flex-wrap">
                <Badge color="green">Success</Badge>
                <Badge color="blue">Info</Badge>
                <Badge color="yellow">Warning</Badge>
                <Badge color="red">Error</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Other Colors
              </h3>
              <div className="flex gap-3 flex-wrap">
                <Badge color="zinc">Zinc</Badge>
                <Badge color="purple">Purple</Badge>
                <Badge color="pink">Pink</Badge>
                <Badge color="orange">Orange</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Avatar Components */}
        <Card className="p-8">
          <h2 className="font-bold text-white mb-6">Avatars</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Sizes
              </h3>
              <div className="flex gap-6 items-center flex-wrap">
                <Avatar initials="SM" size="sm" />
                <Avatar initials="MD" size="md" />
                <Avatar initials="LG" size="lg" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                With Status
              </h3>
              <div className="flex gap-6 items-center flex-wrap">
                <Avatar initials="ON" status="online" />
                <Avatar initials="AW" status="away" />
                <Avatar initials="BS" status="busy" />
                <Avatar initials="OF" status="offline" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Different Initials
              </h3>
              <div className="flex gap-6 items-center flex-wrap">
                <Avatar initials="DG" />
                <Avatar initials="AI" />
                <Avatar initials="UX" />
                <Avatar alt="User" />
              </div>
            </div>
          </div>
        </Card>

        {/* Design Tokens */}
        <Card className="p-8">
          <h2 className="font-bold text-white mb-6">Design Tokens</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Color Palette
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 bg-dojo-bg-primary rounded-lg border border-white/10" />
                  <p className="text-xs text-dojo-text-tertiary">BG Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 bg-dojo-bg-secondary rounded-lg border border-white/10" />
                  <p className="text-xs text-dojo-text-tertiary">
                    BG Secondary
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 bg-dojo-accent-primary rounded-lg" />
                  <p className="text-xs text-dojo-text-tertiary">
                    Accent Primary
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 bg-dojo-accent-secondary rounded-lg" />
                  <p className="text-xs text-dojo-text-tertiary">
                    Accent Secondary
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Glassmorphism
              </h3>
              <div className="relative h-40 bg-gradient-to-br from-dojo-bg-primary to-dojo-bg-tertiary rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo border border-white/10 rounded-lg p-6 shadow-dojo-lg">
                    <p className="text-white font-medium">
                      Glass Card with Blur
                    </p>
                    <p className="text-dojo-text-secondary text-sm">
                      backdrop-blur-dojo + rgba background
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-dojo-text-secondary mb-3">
                Sunset Gradient
              </h3>
              <div className="h-24 bg-gradient-to-br from-dojo-accent-primary via-dojo-accent-secondary to-dojo-accent-tertiary rounded-lg shadow-dojo-glow" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/components")({
  component: ComponentsPage,
});

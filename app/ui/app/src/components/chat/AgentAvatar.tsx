import { Avatar } from "../ui/avatar";

export type AgentType =
  | "supervisor"
  | "dojo"
  | "librarian"
  | "builder"
  | "user";

type AgentAvatarProps = {
  agentType: AgentType;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const agentIcons: Record<AgentType, string> = {
  supervisor: "🎯",
  dojo: "🥋",
  librarian: "📚",
  builder: "🔨",
  user: "👤",
};

const agentLabels: Record<AgentType, string> = {
  supervisor: "Supervisor",
  dojo: "Dojo",
  librarian: "Librarian",
  builder: "Builder",
  user: "User",
};

export function AgentAvatar({
  agentType,
  size = "md",
  className,
}: AgentAvatarProps) {
  const icon = agentIcons[agentType];
  const label = agentLabels[agentType];

  return (
    <Avatar initials={icon} alt={label} size={size} className={className} />
  );
}

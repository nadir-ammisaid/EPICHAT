import { useMemo, useState, type RefObject } from "react";

type Member = { id: string; username: string };
const EVERYBODY = { id: "everybody", username: "Everybody" };

export function useMentions(
  members: Member[],
  text: string,
  onInsert: (newText: string) => void,
  inputRef: RefObject<HTMLInputElement | null>,
) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const filteredMembers = useMemo(() => {
    const allMembers = [EVERYBODY, ...members];
    if (!mentionFilter) return allMembers;
    return allMembers.filter((m) =>
      m.username?.toLowerCase().includes(mentionFilter),
    );
  }, [members, mentionFilter]);


  function onTextChange(value: string) {
    const atMatch = value.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionFilter(atMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionFilter("");
    }
  }

  function insertMention(username: string) {
    onInsert(text.replace(/@\w*$/, `@${username} `));
    setShowMentions(false);
    setMentionFilter("");
    inputRef.current?.focus();
  }

  return {
    showMentions,
    setShowMentions,
    mentionIndex,
    setMentionIndex,
    filteredMembers,
    onTextChange,
    insertMention,
  };
}

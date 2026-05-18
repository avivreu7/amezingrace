"use client";
import { useState, useRef } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Props {
  onSubmit: (answer: string) => Promise<boolean>;
}

export default function SolutionInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;

    setLoading(true);
    setError("");

    const correct = await onSubmit(value);

    if (!correct) {
      setShake(true);
      setError("לא נכון — נסה שוב!");
      setValue("");
      setTimeout(() => {
        setShake(false);
        inputRef.current?.focus();
      }, 450);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <Input
        ref={inputRef}
        label="הכנס את הפתרון"
        placeholder="תשובתך כאן..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        shake={shake}
        error={error}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="text"
      />
      <Button type="submit" variant="mustard" size="lg" fullWidth loading={loading}>
        ✓ שלח תשובה
      </Button>
    </form>
  );
}

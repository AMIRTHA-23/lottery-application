'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dices, Trophy, XCircle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MAX_GUESSES = 7;

export default function SampleGamePage() {
  const { toast } = useToast();
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [previousGuesses, setPreviousGuesses] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'higher' | 'lower' | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const startNewGame = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setCurrentGuess('');
    setPreviousGuesses([]);
    setFeedback(null);
    setGameState('playing');
  };

  // Start the game on component mount
  useEffect(() => {
    startNewGame();
  }, []);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = parseInt(currentGuess, 10);

    if (isNaN(guess) || guess < 1 || guess > 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Guess',
        description: 'Please enter a number between 1 and 100.',
      });
      return;
    }

    if (previousGuesses.includes(guess)) {
      toast({
        variant: 'destructive',
        title: 'Already Guessed',
        description: `You've already tried the number ${guess}.`,
      });
      return;
    }

    const newGuesses = [...previousGuesses, guess];
    setPreviousGuesses(newGuesses);
    setCurrentGuess('');

    if (guess === targetNumber) {
      setGameState('won');
      setFeedback(null);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost');
      setFeedback(null);
    } else {
      setFeedback(guess > targetNumber ? 'lower' : 'higher');
    }
  };

  const guessesLeft = MAX_GUESSES - previousGuesses.length;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Guess the Number!</h1>
        <p className="text-muted-foreground">A fun sample game to test your luck. Guess the number between 1 and 100.</p>
      </div>

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Can you guess the secret number?</CardTitle>
          <CardDescription className="text-center">
            You have {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gameState === 'playing' && (
            <form onSubmit={handleGuessSubmit} className="space-y-4">
              <Input
                type="number"
                placeholder="Enter your guess (1-100)"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                className="h-14 text-center text-2xl font-bold"
                disabled={gameState !== 'playing'}
              />
              <Button type="submit" className="w-full" disabled={gameState !== 'playing'}>
                Submit Guess
              </Button>
            </form>
          )}

          {feedback && gameState === 'playing' && (
            <Alert className="mt-4 text-center">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Hint</AlertTitle>
              <AlertDescription>The secret number is <span className="font-bold">{feedback}</span>!</AlertDescription>
            </Alert>
          )}

          {gameState === 'won' && (
            <Alert variant="success" className="text-center">
              <Trophy className="h-4 w-4" />
              <AlertTitle>You Won!</AlertTitle>
              <AlertDescription>
                Congratulations! You guessed the number <span className="font-bold">{targetNumber}</span> in {previousGuesses.length} {previousGuesses.length === 1 ? 'try' : 'tries'}.
              </AlertDescription>
            </Alert>
          )}

          {gameState === 'lost' && (
            <Alert variant="destructive" className="text-center">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Game Over</AlertTitle>
              <AlertDescription>
                You ran out of guesses! The secret number was <span className="font-bold">{targetNumber}</span>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {previousGuesses.length > 0 && (
            <div className="w-full">
              <p className="text-sm font-medium text-center mb-2">Your Guesses:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {previousGuesses.map((guess) => (
                  <Badge key={guess} variant={guess === targetNumber ? 'success' : 'secondary'}>
                    {guess}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {gameState !== 'playing' && (
            <Button onClick={startNewGame} className="w-full">
              <Dices className="mr-2 h-4 w-4" />
              Play Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

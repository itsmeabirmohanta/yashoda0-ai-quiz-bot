import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time_per_question_sec: "",
    shuffle_questions: false,
    shuffle_options: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Make sure description is not an empty string (should be null instead)
      // and properly handle the time_per_question_sec value
      const quizData = {
        title: formData.title.trim(),
        description: formData.description && formData.description.trim() ? formData.description.trim() : null,
        time_per_question_sec: formData.time_per_question_sec ? 
          parseInt(formData.time_per_question_sec) : null,
        shuffle_questions: formData.shuffle_questions,
        shuffle_options: formData.shuffle_options,
        // Explicitly set defaults as defined in the migration
        is_open: false,
        scoring_strategy: 'most_correct_then_fastest',
      };

      console.log('Creating quiz with data:', quizData);
      
      // First try inserting with minimal fields to isolate permission issues
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error (first attempt):', error);
        
        // If simple insertion fails, try the full insertion
        const { data: fullData, error: fullError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();
          
        if (fullError) {
          console.error('Supabase error (full attempt):', fullError);
          throw fullError;
        }
        
        toast({
          title: "Success",
          description: "Quiz created successfully!",
        });
        
        navigate(`/admin/quiz/${fullData.id}`);
        return;
      }

      // If we get here, the simple insertion succeeded, now update with full data
      const { error: updateError } = await supabase
        .from('quizzes')
        .update(quizData)
        .eq('id', data.id);
        
      if (updateError) {
        console.warn('Warning: Quiz was created but could not be updated with all fields:', updateError);
      }

      toast({
        title: "Success",
        description: "Quiz created successfully!",
      });

      navigate(`/admin/quiz/${data.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create quiz:', error);
      toast({
        title: "Error",
        description: `Failed to create quiz: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SQ</span>
              </div>
              <h1 className="text-xl font-bold text-primary">SwiftQuiz</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create New Quiz</h2>
          <p className="text-muted-foreground">
            Set up your quiz with basic settings. You can add questions after creation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Configure the basic settings for your quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your quiz (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time per Question (seconds)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  placeholder="Leave empty for no time limit"
                  value={formData.time_per_question_sec}
                  onChange={(e) => setFormData({ ...formData, time_per_question_sec: e.target.value })}
                  min="5"
                  max="300"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Set a time limit for each question (5-300 seconds)
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quiz Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Shuffle Questions</Label>
                    <p className="text-sm text-muted-foreground">
                      Randomize the order of questions for each participant
                    </p>
                  </div>
                  <Switch
                    checked={formData.shuffle_questions}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, shuffle_questions: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Shuffle Answer Options</Label>
                    <p className="text-sm text-muted-foreground">
                      Randomize the order of answer choices for each question
                    </p>
                  </div>
                  <Switch
                    checked={formData.shuffle_options}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, shuffle_options: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Create Quiz
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuiz;
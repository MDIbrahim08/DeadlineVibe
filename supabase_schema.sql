-- Create Tasks Table
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    priority TEXT DEFAULT 'medium',
    "vibeCategory" TEXT DEFAULT 'General',
    completed BOOLEAN DEFAULT false,
    "createdAt" TEXT NOT NULL,
    "completedAt" TEXT,
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies for Tasks
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Create Rescues Table
CREATE TABLE public.rescues (
    id TEXT PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "emailDraft" TEXT NOT NULL,
    "survivalSteps" JSONB NOT NULL,
    "generatedAt" TEXT NOT NULL,
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS for Rescues
ALTER TABLE public.rescues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own rescues" ON public.rescues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own rescues" ON public.rescues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own rescues" ON public.rescues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rescues" ON public.rescues FOR DELETE USING (auth.uid() = user_id);

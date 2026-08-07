import { MainLayout } from '@/components/layout/MainLayout';
import { GraduationCap, Target, Users, Heart } from 'lucide-react';

export function AboutPage() {
  return (
    <MainLayout showSideAds={false}>
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-primary mb-8">About EduHub</h1>
        
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sage" />
              </div>
              <h2 className="text-xl font-semibold text-primary">Our Mission</h2>
            </div>
            <p className="text-muted-foreground">
              EduHub is an independent student-built platform hosted at edu-hub.co.in.
              It is not affiliated with, endorsed by, or connected to any college,
              university, or educational institution. All content is created and
              curated by students for students. Faculty are not involved in any
              capacity.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-primary">What We Offer</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Our platform provides a comprehensive collection of study materials including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Detailed notes for all first-year subjects</li>
              <li>Reference PDFs and study guides</li>
              <li>Previous year question papers (PYQs)</li>
              <li>Video lectures and concept explainers</li>
              <li>AI-powered study assistant for doubt solving</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-sand-light flex items-center justify-center">
                <Users className="w-5 h-5 text-sand" />
              </div>
              <h2 className="text-xl font-semibold text-primary">Who We Are</h2>
            </div>
            <p className="text-muted-foreground">
              EduHub is independently built and maintained by a First Year B.E. student who understands 
              the challenges of engineering academics. We curate and organize content to help you focus 
              on what matters most — learning and understanding the concepts.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-xl font-semibold text-primary">Made with Love</h2>
            </div>
            <p className="text-muted-foreground">
              This platform is built with love for the student community. We're constantly working 
              to improve and expand our offerings. Your feedback and suggestions are always welcome!
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Contact Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-primary">Platform:</strong> EduHub — By Students. For Students.
              </p>
              <p>
                <strong className="text-primary">Website:</strong>{' '}
                <a href="https://edu-hub.co.in" className="text-sage hover:underline">
                  edu-hub.co.in
                </a>
              </p>
              <p>
                <strong className="text-primary">Email:</strong>{' '}
                <a href="mailto:hello@edu-hub.co.in" className="text-sage hover:underline">
                  hello@edu-hub.co.in
                </a>
              </p>
              <p>
                <strong className="text-primary">Creator GitHub:</strong>{' '}
                <a href="https://github.com/R3BEL-thewanderer" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                  @R3BEL-thewanderer
                </a>
              </p>
              <p>
                <strong className="text-primary">Response Time:</strong> We typically respond within 48 hours
              </p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

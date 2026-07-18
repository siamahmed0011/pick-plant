import { Container } from "./container";
import { PageHeader } from "./page-header";
export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="py-10 sm:py-16">
      <Container>
        <PageHeader title={title} description={description} />
      </Container>
    </main>
  );
}

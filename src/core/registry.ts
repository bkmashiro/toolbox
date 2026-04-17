import type { Tool, ToolCategory, CategoryMeta } from './types';
import { CATEGORIES } from './categories';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private byCategory: Map<ToolCategory, Tool[]> = new Map();

  /**
   * Register a tool. Called by each tool module's side-effect import.
   * Throws if a tool with the same ID is already registered.
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with id "${tool.id}" is already registered`);
    }
    this.tools.set(tool.id, tool);

    const existing = this.byCategory.get(tool.category) ?? [];
    existing.push(tool);
    existing.sort((a, b) => a.name.localeCompare(b.name));
    this.byCategory.set(tool.category, existing);
  }

  /**
   * Get a tool by ID. Returns undefined if not found.
   */
  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all tools in a category, sorted alphabetically by name.
   */
  getByCategory(category: ToolCategory): Tool[] {
    return this.byCategory.get(category) ?? [];
  }

  /**
   * Get all registered tools.
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Search tools by query string. Matches against name, description, tags.
   * Returns results sorted by relevance (name match > tag match > description match).
   * Uses simple substring matching (case-insensitive), not fuzzy.
   */
  search(query: string): Tool[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();

    const results: Array<{ tool: Tool; score: number }> = [];

    for (const tool of this.tools.values()) {
      let score = 0;
      const name = tool.name.toLowerCase();
      const desc = tool.description.toLowerCase();

      if (name === q) {
        score = 100;
      } else if (name.startsWith(q)) {
        score = 80;
      } else if (name.includes(q)) {
        score = 60;
      }

      if (tool.tags.some(tag => tag === q)) {
        score = Math.max(score, 70);
      } else if (tool.tags.some(tag => tag.includes(q))) {
        score = Math.max(score, 50);
      }

      if (desc.includes(q)) {
        score = Math.max(score, 30);
      }

      if (score > 0) {
        results.push({ tool, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(r => r.tool);
  }

  /**
   * Get category metadata in display order.
   */
  getCategories(): CategoryMeta[] {
    return [...CATEGORIES].sort((a, b) => a.order - b.order);
  }
}

export const registry = new ToolRegistry();

import { mockRequest } from './api'
import { ARTICLES, LEARN_CATEGORIES } from '../mock/learn'

export const learnService = {
  list: () => mockRequest(() => ({ articles: ARTICLES, categories: LEARN_CATEGORIES }), 450),
  get: (id) =>
    mockRequest(() => {
      const a = ARTICLES.find((x) => x.id === id)
      if (!a) throw new Error('Article not found')
      return a
    }, 350),
}

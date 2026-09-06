import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import ExamMode from './ExamMode'

vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
const questions = [
  { question: 'First?', options: ['a', 'b', 'c', 'd'] },
  { question: 'Second?', options: ['a', 'b', 'c', 'd'] },
]

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({ data: [] })
  axios.post.mockImplementation(async (url, payload) => {
    if (url.endsWith('/flashcards/exam')) return { data: { exam_id: 'attempt-1', questions } }
    if (url.endsWith('/answer')) return { data: {
      correct: payload.question_index === 1,
      correct_index: payload.question_index === 0 ? 1 : 2,
      score: payload.question_index === 0 ? 0 : 1,
    } }
    if (url.endsWith('/scores/')) return { data: { score: 1, total: 2, percentage: 50 } }
    throw new Error('Unexpected request')
  })
})
afterEach(cleanup)

async function begin() {
  const user = userEvent.setup()
  render(<ExamMode fileData={{ chapters: ['Chapter'], file_path: 'uploads/book.pdf' }} onExit={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'Start Exam' }))
  await screen.findByText('First?')
  return user
}

describe('server-graded exam', () => {
  it('grades each answer and saves the attempt without double-counting the final answer', async () => {
    const user = await begin()
    await user.click(screen.getByRole('button', { name: /^A\.\s*a$/ }))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))
    await user.click(await screen.findByRole('button', { name: 'Next Question' }))
    await screen.findByText('Second?')
    await user.click(screen.getByRole('button', { name: /^C\.\s*c$/ }))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))
    await user.click(await screen.findByRole('button', { name: 'See Results' }))
    await screen.findByText('Exam Complete')
    expect(screen.getByText(/1\/2/)).toBeTruthy()
    expect(screen.getByText('(50%)')).toBeTruthy()
    const saves = axios.post.mock.calls.filter(([url]) => url.endsWith('/scores/'))
    expect(saves).toHaveLength(1)
    expect(saves[0][1]).toEqual({ exam_id: 'attempt-1' })
    expect(axios.get).toHaveBeenCalledOnce()
  })

  it('keeps the question available for retry when answer submission fails', async () => {
    const user = await begin()
    axios.post.mockRejectedValueOnce({ response: { data: { detail: 'Please retry your answer.' } } })
    await user.click(screen.getByRole('button', { name: /^A\.\s*a$/ }))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Please retry your answer.')
    expect(screen.queryByRole('button', { name: 'Next Question' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))
    expect(await screen.findByRole('button', { name: 'Next Question' })).toBeTruthy()
  })
})

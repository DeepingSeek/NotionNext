import { FOCUS_RING } from './shared'

export const SORT_OPTIONS = [
  { key: 'intelligence', label: '综合分' },
  { key: 'price', label: '价格' },
  { key: 'speed', label: '输出速度' },
  { key: 'ttft', label: '首字延迟' }
]

const SortChips = ({ value, onChange }) => (
  <div role='group' aria-label='排序方式' className='flex flex-wrap gap-2'>
    {SORT_OPTIONS.map(option => {
      const active = option.key === value
      return (
        <button
          key={option.key}
          type='button'
          aria-pressed={active}
          onClick={() => onChange(option.key)}
          className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
            active
              ? 'border-dark bg-dark text-white dark:border-white dark:bg-black dark:text-white'
              : 'border-gray-300 text-dark hover:border-gray-500 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-400'
          }`}>
          {option.label}
        </button>
      )
    })}
  </div>
)

export default SortChips

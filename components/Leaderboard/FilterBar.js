import { FOCUS_RING } from './shared'

const inputClass = `h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-dark placeholder:text-body-color dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 ${FOCUS_RING}`

/**
 * 搜索框与厂商下拉；使用原生 select，移动端与读屏体验更稳定
 */
const FilterBar = ({ query, onQueryChange, vendor, vendorOptions, onVendorChange }) => (
  <div className='flex w-full flex-col gap-3 sm:flex-row xl:w-auto'>
    <div className='flex flex-1 flex-col gap-1.5 sm:w-72 sm:flex-none'>
      <label htmlFor='leaderboard-search' className='text-sm font-medium text-dark dark:text-gray-200'>
        搜索模型或厂商
      </label>
      <input
        id='leaderboard-search'
        type='search'
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder='例如 GPT、Claude'
        autoComplete='off'
        className={inputClass}
      />
    </div>
    <div className='flex flex-col gap-1.5 sm:w-56'>
      <label htmlFor='leaderboard-vendor' className='text-sm font-medium text-dark dark:text-gray-200'>
        厂商
      </label>
      <select
        id='leaderboard-vendor'
        value={vendor}
        onChange={event => onVendorChange(event.target.value)}
        className={inputClass}>
        <option value=''>全部厂商</option>
        {vendorOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  </div>
)

export default FilterBar

import { FOCUS_RING } from './shared'

const Attribution = ({ sourceName, sourceUrl, licenseNotice }) => (
  <footer className='mt-12 space-y-2 border-t border-gray-200 pt-6 text-sm text-body-color dark:border-gray-800 dark:text-gray-400'>
    {sourceName && (
      <p>
        Source:{' '}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={`rounded underline underline-offset-4 hover:text-dark dark:hover:text-gray-200 ${FOCUS_RING}`}>
            {sourceName}
          </a>
        ) : (
          sourceName
        )}
      </p>
    )}
    {licenseNotice && <p>{licenseNotice}</p>}
  </footer>
)

export default Attribution

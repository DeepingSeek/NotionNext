import { buildNavTree, toggleExpandedIds } from '@/themes/gitbook/navTree'

const post = (id, category) => ({ id, href: `/${id}`, category })

// 入门 > 基础 > 概念解释 / 入门 > 上手 > 教程，以及同级另一个一级 Azure
const tree = buildNavTree([
  post('p1', '入门 > 基础 > 概念解释'),
  post('p2', '入门 > 上手 > 教程'),
  post('p3', 'Azure > 总览 > 概念解释')
])
const [intro, azure] = tree.entries
const basic = intro.entries.find(e => e.name === '基础')
const quick = intro.entries.find(e => e.name === '上手')

describe('toggleExpandedIds', () => {
  it('展开子级时保留祖先展开状态', () => {
    let ids = toggleExpandedIds([], intro, [intro, azure], true)
    ids = toggleExpandedIds(ids, basic, [basic, quick], true)
    expect(ids).toEqual([intro.id, basic.id])
  })

  it('再次点击已展开的文件夹会收起它', () => {
    const ids = toggleExpandedIds([intro.id, basic.id], basic, [basic, quick], true)
    expect(ids).toEqual([intro.id])
  })

  it('排他折叠：展开同级文件夹时收起兄弟及其子孙，但不影响祖先', () => {
    const ids = toggleExpandedIds(
      [intro.id, basic.id, azure.id],
      quick,
      [basic, quick],
      true
    )
    expect(ids).toEqual([intro.id, azure.id, quick.id])
  })

  it('非排他模式：同级文件夹可以同时展开', () => {
    const ids = toggleExpandedIds([intro.id, basic.id], quick, [basic, quick], false)
    expect(ids).toEqual([intro.id, basic.id, quick.id])
  })

  it('不修改传入的数组', () => {
    const prev = [intro.id]
    toggleExpandedIds(prev, basic, [basic, quick], true)
    expect(prev).toEqual([intro.id])
  })
})

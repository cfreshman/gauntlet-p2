import { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { useSkills } from '../../lib/hooks/useSkills'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { supabase } from '../../lib/supabase'

interface SkillManagerProps {
  teamId?: string | null  // Made optional since it's not used
}

export function SkillManager(_props: SkillManagerProps) {  // Prefix with _ to indicate unused
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const { user, profile } = useAuth()
  const { skills, userSkills, loading, refresh } = useSkills(user?.id)  // Removed unused skillsError

  // Filter skills based on search
  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(search.toLowerCase()) &&
    !userSkills.has(skill.id)
  )

  async function handleCreateSkill(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const { error: skillError } = await supabase  // Removed unused skill variable
        .from('skills')
        .insert({ name })
        .select()
        .single()

      if (skillError) throw skillError

      setName('')
      refresh()
    } catch (err) {
      console.error('Error creating skill:', err)
      setError('failed to create skill')
    }
  }

  async function handleDeleteSkill(skillId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user?.id)
        .eq('skill_id', skillId)

      if (deleteError) throw deleteError
      refresh()
    } catch (err) {
      console.error('Error removing skill:', err)
      setError('failed to remove skill')
    }
  }

  async function handleSelectSkill(skillId: string) {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          skill_id: skillId
        })

      if (error) throw error
      setOpen(false)
      refresh()
    } catch (err) {
      console.error('Error adding skill:', err)
      setError('failed to add skill')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading skills...
    </div>
  )

  const enabledSkills = skills.filter(skill => userSkills.has(skill.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">skills</h3>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              add skill
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[200px]" side="bottom" align="end">
            <Command className="w-full">
              <CommandInput 
                placeholder="search skills..." 
                value={search}
                onValueChange={setSearch}
                className="w-full"
              />
              <CommandEmpty>no skills found</CommandEmpty>
              <CommandGroup>
                {filteredSkills.map(skill => (
                  <CommandItem
                    key={skill.id}
                    value={skill.name}
                    onSelect={() => handleSelectSkill(skill.id)}
                  >
                    {skill.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {profile?.role === 'manager' && (
        <form onSubmit={handleCreateSkill} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-primary/70">name</label>
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="enter skill name"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={!name}>
            create skill
          </Button>
        </form>
      )}

      {enabledSkills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {enabledSkills.map(skill => (
            <div 
              key={skill.id} 
              className="group flex items-center gap-1 px-2 py-1 bg-background border border-primary/20 rounded-full text-sm"
            >
              <span>{skill.name}</span>
              <button
                onClick={() => handleDeleteSkill(skill.id)}
                className="opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-primary/50">no skills set</div>
      )}
    </div>
  )
} 
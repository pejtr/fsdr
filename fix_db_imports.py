with open('server/db.ts', 'r') as f:
    content = f.read()

old = '  smartReplySuggestions, SmartReplySuggestion\n} from "../drizzle/schema";'
new = '  smartReplySuggestions, SmartReplySuggestion,\n  promptTemplates, PromptTemplate,\n  userVideoProjects, UserVideoProject\n} from "../drizzle/schema";'

if old in content:
    content = content.replace(old, new, 1)  # only first occurrence
    with open('server/db.ts', 'w') as f:
        f.write(content)
    print("Imports added successfully")
else:
    print("Pattern not found!")
    # Check what's around line 27
    lines = content.split('\n')
    for i, line in enumerate(lines[24:32], start=25):
        print(f"{i}: {repr(line)}")

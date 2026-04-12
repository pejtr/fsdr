import re

with open('server/db.ts', 'r') as f:
    content = f.read()

# Find and remove the second occurrence of getUserVideoProjects (the duplicate from append)
# The duplicate starts at the second 'export async function getUserVideoProjects'
first_idx = content.find('export async function getUserVideoProjects')
second_idx = content.find('export async function getUserVideoProjects', first_idx + 1)

if second_idx == -1:
    print("No duplicate found for getUserVideoProjects")
else:
    print(f"Found duplicate at index {second_idx}")
    # Find the end of the updateVideoProject function that follows
    # We need to remove from second getUserVideoProjects up to (but not including) seedDefaultPromptTemplates
    seed_idx = content.find('export async function seedDefaultPromptTemplates', second_idx)
    if seed_idx == -1:
        print("seedDefaultPromptTemplates not found after duplicate")
    else:
        # Remove the block between second_idx and seed_idx
        removed = content[second_idx:seed_idx]
        print(f"Removing block:\n{removed[:200]}...")
        content = content[:second_idx] + content[seed_idx:]
        with open('server/db.ts', 'w') as f:
            f.write(content)
        print("Done! Duplicates removed.")

# Verify
count_get = content.count('export async function getUserVideoProjects')
count_create = content.count('export async function createVideoProject')
count_update = content.count('export async function updateVideoProject')
print(f"\nVerification: getUserVideoProjects={count_get}, createVideoProject={count_create}, updateVideoProject={count_update}")

let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code/solana-anchor-sveltekit-multiple-programs/app
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +1 ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/profile-store.ts
badd +1965 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh
badd +354 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66850:/bin/zsh
badd +149 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//67365:/bin/zsh
badd +1 src/routes/polls/index.svelte
badd +141 ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte
badd +5 src/stores/polls/polls-store.ts
badd +43 src/stores/polls/poll-store.ts
badd +32 src/routes/__layout.svelte
badd +4 ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/models/polls-types.ts
badd +28 src/stores/polls/custom-program-store.ts
badd +2 src/routes/basics.svelte
badd +14 ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/SendTransaction.svelte
badd +6 ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/SignMessage.svelte
badd +14 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//96130:/bin/zsh
badd +9 src/stores/polls/profiles-store.ts
argglobal
%argdel
$argadd .
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit src/stores/polls/poll-store.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/profile-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 43 - ((39 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 43
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("src/stores/polls/polls-store.ts", ":p")) | buffer src/stores/polls/polls-store.ts | else | edit src/stores/polls/polls-store.ts | endif
if &buftype ==# 'terminal'
  silent file src/stores/polls/polls-store.ts
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/profile-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 4 - ((3 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 4
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/profile-store.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
argglobal
balt src/stores/polls/polls-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 13 - ((12 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 13
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("src/stores/polls/profiles-store.ts", ":p")) | buffer src/stores/polls/profiles-store.ts | else | edit src/stores/polls/profiles-store.ts | endif
if &buftype ==# 'terminal'
  silent file src/stores/polls/profiles-store.ts
endif
balt src/stores/polls/polls-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 9 - ((8 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 9
normal! 02|
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
tabnext
edit src/stores/polls/custom-program-store.ts
argglobal
balt src/stores/polls/polls-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 28 - ((18 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 28
normal! 031|
tabnext
edit src/routes/polls/index.svelte
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
argglobal
balt src/routes/__layout.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal nofen
silent! normal! zE
let &fdl = &fdl
let s:l = 104 - ((11 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 104
normal! 038|
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/SignMessage.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 141 - ((33 * winheight(0) + 30) / 61)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 141
let s:c = 40 - ((8 * winwidth(0) + 51) / 103)
if s:c > 0
  exe 'normal! ' . s:c . '|zs' . 40 . '|'
else
  normal! 040|
endif
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
tabnext
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd _ | wincmd |
split
1wincmd k
wincmd w
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe '1resize ' . ((&lines * 30 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 103 + 103) / 207)
exe '4resize ' . ((&lines * 30 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 103 + 103) / 207)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/profile-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 2567 - ((29 * winheight(0) + 15) / 30)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 2567
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//96130:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//96130:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//96130:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//96130:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 14 - ((13 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 14
normal! 017|
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66850:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66850:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66850:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66850:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66387:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 438 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 438
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//67365:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//67365:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//67365:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//67365:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//66850:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 149 - ((29 * winheight(0) + 15) / 30)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 149
normal! 0
wincmd w
exe '1resize ' . ((&lines * 30 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 103 + 103) / 207)
exe '4resize ' . ((&lines * 30 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 103 + 103) / 207)
tabnext 1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
set hlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :

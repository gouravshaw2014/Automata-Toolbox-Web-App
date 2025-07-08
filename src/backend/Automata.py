from collections import defaultdict, deque
from typing import List, Tuple, Dict, Set
from copy import deepcopy

class NFA:
    def __init__(self, Q, E, T, q0, F):
        self.Q = Q
        self.E = E
        # self.T = T
        self.T = self.convert(T)  # Transitions: (q, a) → q'
        self.q = q0
        self.q0 = q0
        self.F = F

    def convert(self,T):
        CT = {}
        for state, symbol, next_states in T:
            key = (state, symbol)
            if key in CT:
                CT[key] |= next_states  # Union the sets
            else:
                CT[key] = set(next_states)
        return CT

    def accepts(self, string):
        queue = deque()
        for q in self.q0:
            queue.append((q, 0))
        
        while queue:
            state, pos = queue.popleft()
            if pos == len(string):
                # Accept only if we're in the final state at end
                if state in self.F:
                    return True
                continue

            a = string[pos]
            if (state,'ε') in self.T:
                for next_state in self.T[(state,'ε')]:
                    queue.append((next_state, pos))
            if(state,a) in self.T:
                for next_state in self.T[(state, a)]:
                    queue.append((next_state, pos + 1))
                    
            else:
                continue

        return False

    def combine(self, nfa2):
        nfa1 = self
        Q = set()
        T = []
        F = set()
        E = nfa1.E.intersection(nfa2.E)  # Only consider common alphabet

        for q1 in nfa1.Q:
            for q2 in nfa2.Q:
                combined_state = q1 + q2
                Q.add(combined_state)

                for symbol in E:
                    next1 = nfa1.T.get((q1, symbol), set())
                    next2 = nfa2.T.get((q2, symbol), set())

                    for p1 in next1:
                        for p2 in next2:
                            next_state = p1 + p2
                            next_state_set = {next_state}
                            T.append((combined_state, symbol, next_state_set))
                            # T[(combined_state, symbol, next_state)]

                if q1 in nfa1.F and q2 in nfa2.F:
                    F.add(combined_state)

        q0 = set()
        for q1 in nfa1.q0:
            for q2 in nfa2.q0:
                combined_state = q1 + q2
                q0.add(combined_state)
        
        return NFA(Q, E, T, q0, F)
        
    def emptiness(self):
        visited = set()
        for q in self.q0:
            queue = deque([q])

        while queue:
            current = queue.popleft()
            if current in self.F:
                return False  # Found an accepting state

            if current in visited:
                continue
            visited.add(current)

            next_states = self.T.get((current, 'ε'), set())
            for state in next_states:
                if state not in visited:
                    queue.append(state)

            for symbol in self.E:
                next_states = self.T.get((current, symbol), set())
                for state in next_states:
                    if state not in visited:
                        queue.append(state)

        return True

class RA:
    def __init__(self, Q, E, T, R0, U, q0, F):

        self.Q = Q
        self.E = E
        # self.T = T
        self.T = self.convert(T)  # Transitions: (q, a, i) → q'
        self.R = R0  # Current register config: [k] → D⊥
        self.U = U  # Update function: (q, a) → j
        self.q0 = q0
        self.F = F

    def convert(self,T):
        CT = {}
        for state, symbol, condition, next_states in T:
            key = (state, symbol, condition)
            if key in CT:
                CT[key] |= next_states  # Union the sets
            else:
                CT[key] = set(next_states)
        return CT

    def accepts(self, string: List[Tuple[str, str]]) -> bool:
        # current_states = {(self.q0, 0, frozenset((h, str(v)) for h, v in self.R.items()))}
        queue = deque()
        queue.append((self.q0, 0, frozenset((h, str(v)) for h, v in self.R.items())))
        while queue:
            state, pos, r_frozen = queue.popleft()
            r_cur = dict(r_frozen)

            if pos == len(string):
                if state in self.F:
                    return True
                continue

            a, d = string[pos]
            matched = False

            # Case 1: d matches existing register value
            for reg, val in r_cur.items():
                if val == d :
                    matched = True
                    if (state, a, reg) in self.T:
                        for next_state in self.T[(state, a, reg)]:
                            queue.append((next_state, pos + 1, r_frozen))  # No change to registers

            if matched:
                continue

            # Case 2: fresh value
            if (state, a) in self.U:
                j = self.U[(state, a)]
                r_next = dict(r_cur)
                r_next[j] = d
                if (state, a, j) in self.T:
                    for next_state in self.T[(state, a, j)]:
                        queue.append((next_state, pos + 1, frozenset(r_next.items())))
                            
        return False

class SAFA:
    def __init__(self, Q, E, q0, F, H, T):
        self.Q = Q
        self.E = E
        self.q0 = q0
        self.F = F
        H_new = {}
        for h in H:
            H_new[h] = set()
        self.H = H_new
        self.T = self.convert(T)  # { (state, symbol, condition) : set of "next_state,set_name" }

    def convert(self,T):
        grouped = defaultdict(set)

        for state, symbol, condition, next_states in T:
            key = (state, symbol, condition)
            grouped[key].update(next_states)

        St = defaultdict(list)
        for (state, symbol, condition), targets in grouped.items():
            St[(state, symbol)].append((condition, targets))

        # Optional: convert lists to tuples for consistent format
        for key in St:
            St[key] = tuple(St[key])

        return dict(St)

    def condition_check(self, cond: str, data: str, H_copy: Dict[str, Set[str]]) -> bool:
        if cond == '-' or cond == '':
            return True

        parts = cond.split(',')
        if len(parts) != 2:
            raise ValueError(f"Invalid condition format: {cond}")

        set_name, flag = parts
        if set_name == '-':
            return True

        known = data in H_copy.get(set_name, set())

        if flag == '0' and known:
            return True
        if flag == '1' and not known:
            return True

        return False

    def accepts(self, w):
        H_cur = deepcopy(self.H)
        initial_config = (self.q0, H_cur)
        queue = deque()
        queue.append((0, initial_config))
        
        while queue:
            pos, (q, H_copy) = queue.popleft()
            if pos == len(w):
                if q in self.F:
                    return True
                continue

            symbol, data = w[pos]
            key = (q, symbol)

            if key in self.T:
                for cond, ns_action_set in self.T[key]:
                    if not self.condition_check(cond, data, H_copy):
                        continue
                    for ns_action in ns_action_set:
                        if ',' in ns_action:
                            q_next, set_name = ns_action.split(',')
                            
                        else:
                            q_next, set_name = ns_action, '-'  # default to no set

                        H_next = deepcopy(H_copy)
                        if set_name != '-':
                            H_next[set_name].add(data)

                        queue.append((pos + 1, (q_next, H_next)))

        return False

    def convert_nfa_T(self):
        NFA_T = []
        E = set()
        # remove unused sets in H
        H_unique = set()
        for (q, a), cond_targets in self.T.items():
            for cond, target_set in cond_targets:
                hi, val = cond.split(',')  # e.g., 'h2', '1'
                H_unique.add(hi)
                for target in target_set:
                    q_next, h_next = target.split(',')
                    if h_next != '-':
                        ext_symbol = f"{a},{hi},{val},{h_next}"
                    else:
                        ext_symbol = f"{a},{hi},{val},-"

                    NFA_T.append((q, ext_symbol, {q_next}))

        H = self.H.keys()
        
        H = H_unique
        # print(H)
        H_new = set()
        map = {}
        i=1
        for h in H_unique:
            map[h] = f"h{i}"
            H_new.add(map[h])
            i+=1
        
        H = H_new
        T_new = []

        for q, symbol, next_states in NFA_T:
            new_symbol = symbol
            new_next_states = next_states
            for h in H_unique:
                new_symbol = new_symbol.replace(h, map[h])
                new_next_states = {state.replace(h, map[h]) for state in new_next_states}
            T_new.append((q, new_symbol, new_next_states))

        NFA_T = T_new

        for a in self.E:
            for h1 in H:
                for val in {'0', '1'}:
                    ext_symbol = f"{a},{h1},{val},-"
                    E.add(ext_symbol)
                    for h2 in H:
                        ext_symbol = f"{a},{h1},{val},{h2}"
                        E.add(ext_symbol)
        # print(E)
        return E, NFA_T

    def convert_safa_T(self, E):
        h = len(self.H.keys())
        Q = set()
        for i in range(2 ** h):
            binary = format(i, f'0{h}b')  # Pad binary to length n
            Q.add(f'q{binary}')
        F = deepcopy(Q)
        q0 = f'q{'0'*h}'
        T = []
        for q_curr in Q:
            for a in E:
                for q_next in Q:
                    if self.differnce(q_curr, q_next):
                        continue
                    
                    symbol, hi, val, h_next = a.split(',')

                    index = int(hi[1])
                    if val == '0'and q_curr[-index] == '0':
                        continue
                    if h_next != '-':
                        index = int(h_next[1])
                        if q_next[-index] == '0':
                            continue
                    T.append((q_curr, a, {q_next}))
                    

        return Q, T, q0, F

    def differnce(self, q_curr, q_next):
        if int(q_curr[1:]) > int(q_next[1:]):
            return True
        count = 0
        i = 1
        while(i < len(q_curr)):
            if count == 2:
                return True
            if q_curr[i] == '0' and q_curr[i] != q_next[i]:
                count += 1
            i += 1
        if count == 2:
                return True
        return False
        

    def emptiness(self):
        E, T1 = self.convert_nfa_T()
        # print(T1)
        nfa1 = NFA(self.Q, E, T1, {self.q0}, self.F)
        if nfa1.emptiness():
            return True
        Q2, T2, q02, F2 = self.convert_safa_T(E)
        # print(T2)
        nfa2 = NFA(Q2, E, T2, {q02}, F2)
        nfa = nfa1.combine(nfa2)
        # print(nfa.T)
        return nfa.emptiness()    
class CCA:
    def __init__(self, Q, E, I, F, T):
        self.Q = Q                  # States
        self.E = E          # Alphabet
        self.I = I                  # Initial states
        self.F = F                  # Final states
        self.T = self.convert(T)          # (q, a, cond, inst, q_next)

    def convert(self,T):
        '''
        Convert to CCA_T format for optimaized selction of next states
            {('q0', 'a'): ((('=', 0), '+1', {'q1', 'q0'}), (('=', 1), '0', {'q1'})),
            ('q0', 'b'): ((('>=', 0), '0', {'q0'}), (('>=', 0), '0', {'q1'})),
            ('q1', 'a'): ((('>=', 0), '0', {'q1'}),),
            ('q1', 'b'): ((('>=', 0), '0', {'q1'}),)}

        '''
        temp = defaultdict(set)

        # Merge transitions with same (state, symbol, condition, instruction)
        for state, symbol, condition, instruction, next_states in T:
            key = (state, symbol, condition, instruction)
            temp[key].update(next_states)

        # Convert to final CCA_T format
        grouped = defaultdict(list)
        for (state, symbol, condition, instruction), next_states in temp.items():
            grouped[(state, symbol)].append((condition, instruction, next_states))

        # Convert lists to tuples for consistency
        for key in grouped:
            grouped[key] = tuple(grouped[key])

        return dict(grouped)

    def evaluate_condition(self, count: str, cond: Tuple[str, str]) -> bool:
        op, val = cond
        if op == '=':
            if len(count) == len(val):
                return count == val
            else:
                return False
        elif op == '>=':
            if len(count) > len(val):
                return True
            elif len(count) == len(val):
                for i in range(len(count)):
                    if count[i] < val[i]:
                        return False
                return True
            else:
                return False
        elif op == '>':
            if len(count) > len(val):
                return True
            elif len(count) == len(val):
                for i in range(len(count)):
                    if count[i] <= val[i]:
                        return False
                return True
            else:
                return False
        elif op == '<':
            if len(count) < len(val):
                return True
            elif len(count) == len(val):
                for i in range(len(count)):
                    if count[i] > val[i]:
                        return False
                return True
            else:
                return False
        elif op == '<=':
            if len(count) < len(val):
                return True
            elif len(count) == len(val):
                for i in range(len(count)):
                    if count[i] >= val[i]:
                        return False
                return True
            else:
                return False
        elif op == '!=':
            if len(count) == len(val):
                return count != val
            else:
                return True
        else:
            raise ValueError(f"Unknown condition: {cond}")

    def apply_instruction(self, count: str, inst: str, data: str, counter: Dict[str, str]) -> None:
        if inst == '*':
            if data in counter:
                counter[data] = '0'  # Reset completely
        elif inst == '0':
            pass  # Keep the count as is (no update needed)
        elif inst.startswith('+'):
            result = int(count) + int(inst[1:])
            counter[data] = str(result)
        else:
            raise ValueError(f"Invalid instruction: {inst}")

    def accepts(self, input_seq):
        queue = deque()

        # Initialize the queue with all initial states and an empty counter dictionary
        for state in self.I:
            queue.append((state, 0, {}))  # (current_state, input_index, counter_dict)

        while queue:
            q, i, h = queue.popleft()

            if i == len(input_seq):
                if q in self.F:
                    return True
                continue

            sym, data = input_seq[i]
            count = h.get(data, '0')

            key = (q, sym)
            if key in self.T:
                for cond, inst, q_next_set in self.T[key]:
                    if self.evaluate_condition(count, cond):
                        new_h = deepcopy(h)
                        self.apply_instruction(count, inst, data, new_h)
                        for q_next in q_next_set:
                            queue.append((q_next, i + 1, new_h))

        return False

class CMA:
    def __init__(self, Q, Sigma, delta, q0, Fl, Fg):
        self.Q = Q              # Set of states
        self.E = Sigma      # Alphabet
        # self.T = delta
        self.T = self.convert(delta)      # Transition relation: (state, symbol, last_state) -> set of next states
        self.q0 = q0            # Initial state
        self.Fl = Fl            # Local accepting states
        self.Fg = Fg            # Global accepting states

    def convert(self, T):
        CT = {}
        for state, symbol,last_used, next_states in T:
            key = (state, symbol, last_used)
            if key in CT:
                CT[key] |= next_states  # Union the sets
            else:
                CT[key] = set(next_states)
        return CT

    def accepts(self, input_seq):
        queue = deque()
        h0 = {}  # hash function: data -> last used state, initially empty
        queue.append((self.q0, 0, h0))  # (current_state, input_index, hash_function)

        while queue:
            state, i, h = queue.popleft()

            if i == len(input_seq):
                # Global acceptance check
                if state in self.Fg and all(v in self.Fl for v in h.values()):
                    return True
                continue

            sym, data = input_seq[i]
            last_state = h.get(data, '-')  # '-' represents unseen (⊥)
            key = (state, sym, last_state)

            if key in self.T:
                for next_state in self.T[key]:
                    new_h = deepcopy(h)
                    new_h[data] = next_state  # update memory
                    queue.append((next_state, i + 1, new_h))

        return False    

def parse_nfa(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    namespace = {}
    exec(content, {}, namespace)  # Safe limited scope

    Q = set(namespace['Q'])
    E = set(namespace['E'])
    F = set(namespace['F'])
    T = list(namespace['T'])
    q0 = namespace['q0']
    test_cases = list(namespace['test_cases'])

    nfa = NFA(Q, E, T, q0, F)
    result = 'Emptiness' if nfa.emptiness() else 'Not Emptiness'
    print(result)

    for i, test in enumerate(test_cases):
        result =  'Accepted' if nfa.accepts(test) else 'Rejected'
        print(f"Test case {i+1} : {test}\n{result}\n")

def parse_ra(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    namespace = {}
    exec(content, {}, namespace)

    Q = set(namespace['Q'])
    E = set(namespace['E'])
    R0 = dict(namespace['R0'])
    T = list(namespace['T'])
    U = dict(namespace['U'])
    q0 = namespace['q0']
    F = set(namespace['F'])
    test_cases = namespace['test_cases']

    ra = RA(Q, E, T, R0, U, q0, F)
    # result = 'Emptiness' if ra.emptiness() else 'Not Emptiness'
    # print(result)

    for i, test in enumerate(test_cases):
        result =  'Accepted' if ra.accepts(test) else 'Rejected'
        print(f"Test case {i+1} : {test}\n{result}\n")

def parse_safa(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    namespace = {}
    exec(content, {}, namespace)

    Q = set(namespace['Q'])
    E = set(namespace['E'])
    q0 = namespace['q0']
    H = set(namespace['H'])
    F = set(namespace['F'])
    T = list(namespace['T'])    
    test_cases = list(namespace['test_cases'])

    safa = SAFA(Q, E, q0, F, H, T)
    result = 'Emptiness' if safa.emptiness() else 'Not Emptiness'
    print(result)

    for i, test in enumerate(test_cases):
        result =  'Accepted' if safa.accepts(test) else 'Rejected'
        print(f"Test case {i+1} : {test}\n{result}\n")

def parse_cca(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    namespace = {}
    exec(content, {}, namespace)

    Q = set(namespace['Q'])
    E = set(namespace['E'])
    I = set(namespace['I'])
    F = set(namespace['F'])
    T = list(namespace['T'])    
    test_cases = list(namespace['test_cases'])

    cca = CCA(Q, E, I, F, T)

    for i, test in enumerate(test_cases):
        result =  'Accepted' if cca.accepts(test) else 'Rejected'
        print(f"Test case {i+1} : {test}\n{result}\n")

def parse_cma(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    namespace = {}
    exec(content, {}, namespace)

    Q = set(namespace['Q'])
    E = set(namespace['E'])
    q0 = namespace['q0']
    Fl = set(namespace['Fl'])
    Fg = set(namespace['Fg'])
    T = list(namespace['T'])    
    test_cases = list(namespace['test_cases'])

    cma = CMA(Q, E, T, q0, Fl, Fg)

    for i, test in enumerate(test_cases):
        result =  'Accepted' if cma.accepts(test) else 'Rejected'
        print(f"Test case {i+1} : {test}\n{result}\n")
from Automata import *

class AutomataProcessor:
    @staticmethod
    def process(automata_type, config, test_cases):
        if automata_type == 'NFA':
            automaton = NFA(
                set(config['Q']),
                set(config['E']),
                [(t[0], t[1], set(t[2])) for t in config['T']],
                set(config['q0']),
                set(config['F'])
            )
            return [automaton.accepts(tc) for tc in test_cases]
        
        elif automata_type == 'RA':
            # # print("States")
            # Q = set(config['Q'])
            # print("Alphabet")
            # E = set(config['E'])    
            # print("Transition")            
            # T = {(t[0], t[1], t[2]): set(t[3]) for t in config['T']}
            # print("Register")
            # R0 = config['R0']
            # print(config['U'])
            # U = {(u[0],u[1]):u[2] for u in config['U']},
            # print("complete")
            # q0 = config['q0'],
            # F = set(config['F'])
            # automaton = RA(Q,E,T,R0,U,q0,F)
            automaton = RA(
                set(config['Q']),
                set(config['E']),                
                [(t[0], t[1], t[2], set(t[3])) for t in config['T']],
                config['R0'],
                {(u[0],u[1]):u[2] for u in config['U']},
                config['q0'],
                set(config['F'])
            )
            tuple_test_cases = [
                [(step[0], step[1]) for step in test_case]
                for test_case in test_cases
            ]
            # print(automaton.Q, automaton.E, automaton.T, automaton.R, automaton.U, automaton.q0, automaton.F)
            # print(tuple_test_cases)
            return [automaton.accepts(tc) for tc in tuple_test_cases]
        
        elif automata_type == 'SAFA':
                # SAFA typically has components similar to NFA but with synchronous transitions Q, E, q0, F, H, T
                automaton = SAFA(
                    set(config['Q']),
                    set(config['E']),
                    config['q0'],
                    set(config['F']),
		            config['H'],
                    [(t[0], t[1],t[2],set(t[3])) for t in config['T']]
                )
                return [automaton.accepts(tc) for tc in test_cases]
            
        elif automata_type == 'CCA':
            # CCA has communication states and message alphabets
            automaton = CCA(
                set(config['Q']),
                set(config['E']),
                set(config['I']),
		        set(config['F']),
                [(x[0], x[1], tuple(x[2]), x[3], set(x[4])) for x in config['T']]
            )
            tuple_test_cases = [
                [(step[0], step[1]) for step in test_case]
                for test_case in test_cases
            ]
            return [automaton.accepts(tc) for tc in tuple_test_cases]
        
        elif automata_type == 'CMA':
            # CMA has shared memory components
            automaton = CMA(
                set(config['Q']),
                set(config['E']),
                [(t[0], t[1], t[2], set(t[3])) for t in config['T']],  # (state, symbol, mem) -> (new_state, new_mem)
                config['q0'],
                set(config['Fl']),
		        set(config['Fg'])
            )
            tuple_test_cases = [
                [(step[0], step[1]) for step in test_case]
                for test_case in test_cases
            ]
            return [automaton.accepts(tc) for tc in tuple_test_cases]
        
        else:
            raise ValueError(f"Unknown automata type: {automata_type}")
                
        # except KeyError as e:
        #     raise ValueError(f"Missing required configuration parameter: {e}")
        # except Exception as e:
        #     raise ValueError(f"Error processing automaton: {str(e)}")


    def check_empty(automata_type, config):
        if automata_type == 'NFA':
            automaton = NFA(
                set(config['Q']),
                set(config['E']),
                [(t[0], t[1], set(t[2])) for t in config['T']],
                set(config['q0']),
                set(config['F'])
            )
            return automaton.emptiness()

        elif automata_type == 'SAFA':
                # SAFA typically has components similar to NFA but with synchronous transitions Q, E, q0, F, H, T
                automaton = SAFA(
                    set(config['Q']),
                    set(config['E']),
                    config['q0'],
                    set(config['F']),
		            config['H'],
                    [(t[0], t[1],t[2],set(t[3])) for t in config['T']]
                )
                return automaton.emptiness() 

        else:
            raise ValueError(f"Unknown automata type: {automata_type}")
